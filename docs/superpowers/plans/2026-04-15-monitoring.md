# Monitoring System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementare un sistema di monitoring per RistoAgent che invia alert immediati e un report mattutino giornaliero via Telegram al proprietario.

**Architecture:** GitHub Actions (esterno, gratuito) gestisce health check ogni 30 min e report giornaliero chiamando endpoint Vercel. Due nuovi endpoint Next.js espongono metriche e stato infrastruttura. Il cron feedback esistente viene esteso per rilevare anomalie.

**Tech Stack:** Next.js App Router, Supabase (service role), Telegram Bot API, GitHub Actions

---

## File Map

| File | Azione | Responsabilità |
|------|--------|---------------|
| `lib/telegram.ts` | Modifica | Aggiunge `sendMonitorAlert()` helper |
| `app/api/health/route.ts` | Crea | Ping DB, risponde 200/503 |
| `app/api/monitor/report/route.ts` | Crea | Metriche 24h protette da secret |
| `app/api/cron/feedback/route.ts` | Modifica | Aggiunge anomaly check silenzio 6h |
| `.github/workflows/monitoring.yml` | Crea | Health check + daily report via GitHub Actions |

---

## Task 1: Helper `sendMonitorAlert` in `lib/telegram.ts`

**Files:**
- Modify: `lib/telegram.ts`

- [ ] **Step 1: Aggiungere la funzione in fondo a `lib/telegram.ts`**

```typescript
export async function sendMonitorAlert(text: string): Promise<void> {
  const botToken = process.env.MONITOR_BOT_TOKEN;
  const chatId = process.env.MONITOR_OWNER_CHAT_ID;
  if (!botToken || !chatId) return;

  await fetch(`${TELEGRAM_API}${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    }),
  });
}
```

- [ ] **Step 2: Verificare che il file compili**

```bash
cd C:\Users\Admin\OneDrive\RISTOAGENT
npx tsc --noEmit
```

Expected: nessun errore TypeScript

- [ ] **Step 3: Test manuale — invia un messaggio di prova al bot monitor**

```bash
curl -s -X POST "https://api.telegram.org/bot8656359796:AAGQbFQiHpWr_v1RqUujVT5aKz1xgOUok2k/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{"chat_id": "713891187", "text": "✅ Test bot monitor attivo"}'
```

Expected: `{"ok":true,...}` e il messaggio arriva su Telegram

- [ ] **Step 4: Commit**

```bash
git add lib/telegram.ts
git commit -m "feat: add sendMonitorAlert helper to telegram lib"
```

---

## Task 2: Endpoint `GET /api/health`

**Files:**
- Create: `app/api/health/route.ts`

- [ ] **Step 1: Creare il file**

```typescript
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from("businesses")
      .select("id", { count: "exact", head: true });

    if (error) throw error;

    return NextResponse.json({ status: "ok", db: "ok", timestamp });
  } catch {
    return NextResponse.json(
      { status: "error", db: "unreachable", timestamp },
      { status: 503 }
    );
  }
}
```

- [ ] **Step 2: Avviare il server locale e verificare**

```bash
npm run dev
```

In un altro terminale:

```bash
curl http://localhost:3000/api/health
```

Expected:
```json
{"status":"ok","db":"ok","timestamp":"2026-04-15T..."}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/health/route.ts
git commit -m "feat: add /api/health endpoint for uptime monitoring"
```

---

## Task 3: Endpoint `GET /api/monitor/report`

**Files:**
- Create: `app/api/monitor/report/route.ts`

- [ ] **Step 1: Creare il file**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  // Auth check
  const secret = req.headers.get("x-monitor-secret");
  if (secret !== process.env.MONITOR_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();
  const now = new Date();
  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  // --- Queries parallele ---
  const [
    { count: newUsers },
    { count: activeBusinesses },
    { count: messagesReceived },
    { count: bookingsCreated },
    { count: feedbacksCollected },
    { data: expiringTrials },
    { data: lastMsg },
    { count: missedFeedbacks },
  ] = await Promise.all([
    supabase
      .from("businesses")
      .select("*", { count: "exact", head: true })
      .gte("created_at", since24h),

    supabase
      .from("businesses")
      .select("*", { count: "exact", head: true })
      .in("plan", ["trial", "starter", "pro", "flexible", "founding_starter", "founding_pro"]),

    supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .gte("created_at", since24h),

    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .gte("created_at", since24h),

    supabase
      .from("feedbacks")
      .select("*", { count: "exact", head: true })
      .gte("created_at", since24h),

    // Trial in scadenza entro 3 giorni: trial_started_at <= 12 giorni fa
    supabase
      .from("businesses")
      .select("name, trial_started_at")
      .eq("plan", "trial")
      .lte(
        "trial_started_at",
        new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString()
      ),

    supabase
      .from("messages")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1),

    // Prenotazioni di ieri confermate senza feedback = cron non girato
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("date", new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split("T")[0])
      .eq("status", "confirmed")
      .is("feedback_sent_at", null),
  ]);

  // Calcola ore dall'ultimo messaggio
  const lastMessageAt = lastMsg?.[0]?.created_at ?? null;
  const hoursSinceLastMessage = lastMessageAt
    ? Math.floor((now.getTime() - new Date(lastMessageAt).getTime()) / (1000 * 60 * 60))
    : null;

  // Calcola data scadenza trial per ogni business
  const trialsWithExpiry = (expiringTrials ?? []).map((b) => ({
    name: b.name,
    expiresAt: new Date(
      new Date(b.trial_started_at).getTime() + 15 * 24 * 60 * 60 * 1000
    )
      .toISOString()
      .split("T")[0],
  }));

  const cronOk = (missedFeedbacks ?? 0) === 0;

  // --- Compone messaggio Telegram ---
  const dateStr = now.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Rome",
  });

  const warningLines: string[] = [];
  if (trialsWithExpiry.length > 0) {
    warningLines.push(`  • Trial in scadenza (3gg): ${trialsWithExpiry.length}`);
    trialsWithExpiry.forEach((t) => {
      warningLines.push(`    → ${t.name} (${t.expiresAt})`);
    });
  }
  if (!cronOk) {
    warningLines.push(`  • ⚠️ Cron feedback: prenotazioni ieri senza feedback`);
  }
  if (hoursSinceLastMessage !== null && hoursSinceLastMessage >= 6 && (activeBusinesses ?? 0) > 0) {
    warningLines.push(`  • ⚠️ Nessun messaggio da ${hoursSinceLastMessage}h`);
  }

  const telegramMessage = [
    `📊 <b>Report RistoAgent — ${dateStr}</b>`,
    ``,
    `🌐 <b>Infrastruttura</b>`,
    `  • Database: ✅ ok`,
    `  • Cron feedback: ${cronOk ? "✅ ok" : "❌ non girato ieri"}`,
    ``,
    `📈 <b>Ultime 24h</b>`,
    `  • Nuovi utenti: ${newUsers ?? 0}`,
    `  • Business attivi: ${activeBusinesses ?? 0}`,
    `  • Messaggi ricevuti: ${messagesReceived ?? 0}`,
    `  • Prenotazioni create: ${bookingsCreated ?? 0}`,
    `  • Feedback raccolti: ${feedbacksCollected ?? 0}`,
    ...(warningLines.length > 0 ? [``, `⚠️ <b>Attenzione</b>`, ...warningLines] : [``, `✅ <b>Nessuna anomalia</b>`]),
  ].join("\n");

  return NextResponse.json({
    telegramMessage,
    data: {
      newUsers: newUsers ?? 0,
      activeBusinesses: activeBusinesses ?? 0,
      messagesReceived: messagesReceived ?? 0,
      bookingsCreated: bookingsCreated ?? 0,
      feedbacksCollected: feedbacksCollected ?? 0,
      trialsExpiringSoon: trialsWithExpiry,
      cronFeedbackOk: cronOk,
      hoursSinceLastMessage,
    },
  });
}
```

- [ ] **Step 2: Aggiungere `MONITOR_SECRET` al file `.env.local`**

Aggiungi questa riga a `.env.local` (genera una stringa casuale):

```
MONITOR_SECRET=monitor_ristoagent_2026_secret
MONITOR_BOT_TOKEN=8656359796:AAGQbFQiHpWr_v1RqUujVT5aKz1xgOUok2k
MONITOR_OWNER_CHAT_ID=713891187
```

- [ ] **Step 3: Verificare con il server locale**

Con il server già avviato (`npm run dev`):

```bash
curl "http://localhost:3000/api/monitor/report" \
  -H "x-monitor-secret: monitor_ristoagent_2026_secret"
```

Expected: JSON con `telegramMessage` e `data`

```bash
# Verifica che senza secret risponda 401
curl "http://localhost:3000/api/monitor/report"
```

Expected: `{"error":"Unauthorized"}`

- [ ] **Step 4: Commit**

```bash
git add app/api/monitor/report/route.ts .env.local
git commit -m "feat: add /api/monitor/report endpoint with 24h metrics"
```

> **Nota:** `.env.local` è in `.gitignore` — non finirà mai su GitHub.

---

## Task 4: Anomaly check in `/api/cron/feedback`

**Files:**
- Modify: `app/api/cron/feedback/route.ts`

- [ ] **Step 1: Aggiungere import di `sendMonitorAlert` in cima al file**

Aggiungi `sendMonitorAlert` all'import esistente di telegram:

```typescript
import { sendMessage, sendMonitorAlert } from "@/lib/telegram";
```

- [ ] **Step 2: Aggiungere il controllo anomalia PRIMA del `return` finale**

Subito prima di `return NextResponse.json({ ok: true, sent });` aggiungere:

```typescript
  // Anomaly check: se ci sono business attivi ma nessun messaggio nelle ultime 6h
  const { count: activeCount } = await supabase
    .from("businesses")
    .select("*", { count: "exact", head: true })
    .in("plan", ["starter", "pro", "flexible", "founding_starter", "founding_pro"]);

  if ((activeCount ?? 0) > 0) {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    const { count: recentMessages } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sixHoursAgo);

    if ((recentMessages ?? 0) === 0) {
      const { data: lastMsg } = await supabase
        .from("messages")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1);

      const lastMsgTime = lastMsg?.[0]?.created_at
        ? new Date(lastMsg[0].created_at).toLocaleTimeString("it-IT", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Europe/Rome",
          })
        : "sconosciuta";

      await sendMonitorAlert(
        `⚠️ <b>ANOMALIA RISTOAGENT</b>\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `Nessun messaggio Telegram da 6h\n` +
        `Business attivi (paid): ${activeCount}\n` +
        `Ultimo messaggio: ${lastMsgTime}\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `Verifica webhook Telegram`
      );
    }
  }
```

- [ ] **Step 3: Verificare che il file compili**

```bash
npx tsc --noEmit
```

Expected: nessun errore

- [ ] **Step 4: Commit**

```bash
git add app/api/cron/feedback/route.ts
git commit -m "feat: add anomaly detection to feedback cron"
```

---

## Task 5: GitHub Actions workflow

**Files:**
- Create: `.github/workflows/monitoring.yml`

- [ ] **Step 1: Creare la directory se non esiste**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: Creare il file `.github/workflows/monitoring.yml`**

```yaml
name: RistoAgent Monitoring

on:
  schedule:
    - cron: '*/30 * * * *'   # health check ogni 30 minuti
    - cron: '0 7 * * *'      # report giornaliero alle 07:00 UTC (08:00 Italia)
  workflow_dispatch:           # consente esecuzione manuale per test

jobs:
  health-check:
    name: Health Check
    runs-on: ubuntu-latest
    # Gira ogni 30 min o manualmente (non per il cron delle 07:00)
    if: >
      github.event_name == 'workflow_dispatch' ||
      (github.event_name == 'schedule' && github.event.schedule == '*/30 * * * *')
    steps:
      - name: Check sito (primo tentativo)
        id: check1
        run: |
          START=$(date +%s%3N)
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${{ secrets.APP_URL }}/api/health" 2>/dev/null || echo "000")
          END=$(date +%s%3N)
          DURATION=$((END - START))
          echo "status=$STATUS" >> $GITHUB_OUTPUT
          echo "duration=${DURATION}ms" >> $GITHUB_OUTPUT

      - name: Attendi 60s e riprova se fallito
        if: steps.check1.outputs.status != '200'
        run: sleep 60

      - name: Check sito (secondo tentativo)
        id: check2
        if: steps.check1.outputs.status != '200'
        run: |
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${{ secrets.APP_URL }}/api/health" 2>/dev/null || echo "000")
          echo "status=$STATUS" >> $GITHUB_OUTPUT

      - name: Invia alert DOWN se entrambi i check falliscono
        if: steps.check1.outputs.status != '200' && steps.check2.outputs.status != '200'
        run: |
          TIME=$(date '+%H:%M — %d %b %Y' --utc)
          TEXT="🚨 ALERT RISTOAGENT%0A━━━━━━━━━━━━━━━━━━━%0A❌ Sito non raggiungibile%0A⏰ ${TIME}%0AStatus: ${{ steps.check1.outputs.status }}%0A🔁 2 check consecutivi falliti%0A━━━━━━━━━━━━━━━━━━━%0A⚡ Controlla Vercel dashboard"
          curl -s -X POST "https://api.telegram.org/bot${{ secrets.MONITOR_BOT_TOKEN }}/sendMessage" \
            -d "chat_id=${{ secrets.OWNER_CHAT_ID }}&text=${TEXT}&parse_mode=HTML"

      - name: Log OK
        if: steps.check1.outputs.status == '200'
        run: echo "✅ Sito online (${{ steps.check1.outputs.duration }})"

  daily-report:
    name: Daily Report
    runs-on: ubuntu-latest
    # Gira solo al cron delle 07:00 UTC o manualmente
    if: >
      github.event_name == 'workflow_dispatch' ||
      (github.event_name == 'schedule' && github.event.schedule == '0 7 * * *')
    steps:
      - name: Controlla uptime
        id: uptime
        run: |
          START=$(date +%s%3N)
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${{ secrets.APP_URL }}/api/health" 2>/dev/null || echo "000")
          END=$(date +%s%3N)
          DURATION=$((END - START))
          echo "status=$STATUS" >> $GITHUB_OUTPUT
          echo "duration=${DURATION}ms" >> $GITHUB_OUTPUT

      - name: Recupera metriche dal report endpoint
        id: report
        run: |
          RESPONSE=$(curl -s --max-time 15 \
            -H "x-monitor-secret: ${{ secrets.MONITOR_SECRET }}" \
            "${{ secrets.APP_URL }}/api/monitor/report")
          # Estrai il campo telegramMessage con python
          MESSAGE=$(echo "$RESPONSE" | python3 -c "
          import sys, json
          data = json.load(sys.stdin)
          print(data.get('telegramMessage', 'Errore nel recupero metriche'))
          ")
          # Salva in file per evitare problemi di escaping
          echo "$MESSAGE" > /tmp/report_message.txt

      - name: Aggiungi info uptime al messaggio
        run: |
          UPTIME_LINE=""
          if [ "${{ steps.uptime.outputs.status }}" == "200" ]; then
            UPTIME_LINE="  • Sito: ✅ online (${{ steps.uptime.outputs.duration }})"
          else
            UPTIME_LINE="  • Sito: ❌ NON RAGGIUNGIBILE"
          fi
          # Inserisce uptime dopo la prima riga "Infrastruttura"
          sed -i "s/  • Database:/  • Sito: placeholder\n  • Database:/" /tmp/report_message.txt
          sed -i "s|  • Sito: placeholder|${UPTIME_LINE}|" /tmp/report_message.txt

      - name: Invia report su Telegram
        run: |
          MESSAGE=$(cat /tmp/report_message.txt)
          python3 -c "
          import urllib.request, urllib.parse, json, sys

          token = '${{ secrets.MONITOR_BOT_TOKEN }}'
          chat_id = '${{ secrets.OWNER_CHAT_ID }}'
          message = open('/tmp/report_message.txt').read()

          data = json.dumps({
            'chat_id': chat_id,
            'text': message,
            'parse_mode': 'HTML'
          }).encode('utf-8')

          req = urllib.request.Request(
            f'https://api.telegram.org/bot{token}/sendMessage',
            data=data,
            headers={'Content-Type': 'application/json'}
          )
          resp = urllib.request.urlopen(req)
          print(resp.read().decode())
          "
```

- [ ] **Step 3: Aggiungere i secrets su GitHub**

Vai su GitHub → repo `RistoAgent` → Settings → Secrets and variables → Actions → New repository secret

Aggiungere questi 4 secrets:

| Nome | Valore |
|------|--------|
| `MONITOR_BOT_TOKEN` | `8656359796:AAGQbFQiHpWr_v1RqUujVT5aKz1xgOUok2k` |
| `OWNER_CHAT_ID` | `713891187` |
| `MONITOR_SECRET` | `monitor_ristoagent_2026_secret` |
| `APP_URL` | `https://ristoagent.com` |

- [ ] **Step 4: Commit e push del workflow**

```bash
git add .github/workflows/monitoring.yml
git commit -m "feat: add GitHub Actions monitoring workflow (health check + daily report)"
git push
```

- [ ] **Step 5: Test manuale del workflow su GitHub**

Vai su GitHub → Actions → "RistoAgent Monitoring" → "Run workflow" → Run

Expected: il workflow gira, ricevi il report su Telegram entro 2 minuti

---

## Task 6: Variabili d'ambiente su Vercel

**Files:**
- Nessun file — configurazione via Vercel dashboard o CLI

- [ ] **Step 1: Aggiungere le 3 variabili su Vercel**

Vai su Vercel → progetto RistoAgent → Settings → Environment Variables

Aggiungere (Environment: Production + Preview):

| Nome | Valore |
|------|--------|
| `MONITOR_SECRET` | `monitor_ristoagent_2026_secret` |
| `MONITOR_BOT_TOKEN` | `8656359796:AAGQbFQiHpWr_v1RqUujVT5aKz1xgOUok2k` |
| `MONITOR_OWNER_CHAT_ID` | `713891187` |

- [ ] **Step 2: Fare redeploy su Vercel per applicare le variabili**

Vai su Vercel → Deployments → "Redeploy" sull'ultimo deployment

- [ ] **Step 3: Verificare endpoint in produzione**

```bash
curl https://ristoagent.com/api/health
```

Expected: `{"status":"ok","db":"ok","timestamp":"..."}`

```bash
curl "https://ristoagent.com/api/monitor/report" \
  -H "x-monitor-secret: monitor_ristoagent_2026_secret"
```

Expected: JSON con `telegramMessage` e `data`

- [ ] **Step 4: Verifica finale — test alert manuale**

Apri GitHub → Actions → "RistoAgent Monitoring" → Run workflow

Expected: ricevi il report Telegram mattutino sul bot monitor entro 1-2 minuti. ✅

---

## Self-Review

**Spec coverage:**
- ✅ Health check ogni 30 min → Task 5 (GitHub Actions health-check job)
- ✅ Report mattutino 08:00 con numeri concreti → Task 5 (daily-report job) + Task 3 (endpoint)
- ✅ Alert immediato sito down → Task 5 (2 tentativi consecutivi)
- ✅ Alert anomalia silenzio 6h → Task 4 (cron feedback)
- ✅ Metriche: nuovi utenti, business attivi, messaggi, prenotazioni, feedback → Task 3
- ✅ Trial in scadenza → Task 3
- ✅ Cron feedback check → Task 3
- ✅ Endpoint `/api/health` → Task 2
- ✅ Endpoint `/api/monitor/report` protetto → Task 3
- ✅ Helper `sendMonitorAlert` → Task 1
- ✅ Variabili d'ambiente → Task 6

**Funzioni coerenti tra i task:**
- `sendMonitorAlert(text: string)` definita in Task 1, usata in Task 4 ✅
- `createServerClient()` usata in Task 2 e Task 3 (già esistente) ✅
- Formato messaggi Telegram coerente con spec ✅
