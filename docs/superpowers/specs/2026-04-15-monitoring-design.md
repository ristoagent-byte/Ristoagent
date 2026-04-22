# RistoAgent — Sistema di Monitoring
**Data:** 2026-04-15  
**Stato:** Approvato

---

## Obiettivo

Tenere sotto controllo il sito RistoAgent con:
- Alert immediati su Telegram quando qualcosa si rompe
- Report mattutino (08:00) con numeri concreti sulle ultime 24h
- Anomaly detection per situazioni sospette (silenzio prolungato, cron non girano)

---

## Architettura

**Approccio:** Ibrido GitHub Actions (esterno) + Vercel Cron (interno)

```
GitHub Actions (esterno, gratuito)
  ├── ogni 30 min → health check → alert Telegram se fallisce
  └── ogni giorno 08:00 → chiama /api/monitor/report → invia report Telegram

Vercel / Next.js
  ├── GET  /api/health              (nuovo, pubblico)
  ├── GET  /api/monitor/report      (nuovo, protetto da secret)
  └── GET  /api/cron/feedback       (esistente, aggiunge anomaly check)

Supabase DB
  └── businesses, messages, bookings, conversations

Bot Telegram Monitor
  └── token: 8656359796:AAGQbFQiHpWr_v1RqUujVT5aKz1xgOUok2k
  └── owner chat_id: 713891187
```

**Costo aggiuntivo: €0**

---

## Componenti da implementare

### 1. `GET /api/health`
Endpoint pubblico, risponde in <500ms.

```json
{
  "status": "ok",
  "db": "ok",
  "timestamp": "2026-04-15T08:00:00Z"
}
```

- Esegue una query leggera su Supabase (es. `SELECT 1`)
- Se DB non risponde → `{ "status": "error", "db": "unreachable" }` con HTTP 503
- Usato da GitHub Actions per health check ogni 30 min

---

### 2. `GET /api/monitor/report`
Endpoint protetto, richiede header `x-monitor-secret: <MONITOR_SECRET>`.

Senza header corretto → HTTP 401.

**Dati restituiti (ultime 24h):**
```json
{
  "infrastructure": {
    "db": "ok",
    "lastCronFeedback": "2026-04-14T21:00:00Z"
  },
  "activity": {
    "newUsers": 3,
    "activeBusinesses": 12,
    "messagesReceived": 47,
    "bookingsCreated": 8,
    "feedbacksCollected": 5
  },
  "warnings": {
    "trialsExpiringSoon": [
      { "name": "Pizzeria Roma", "expiresAt": "2026-04-17" },
      { "name": "Bar Centrale", "expiresAt": "2026-04-18" }
    ],
    "noMessagesHours": 0,
    "cronDelayedHours": 0
  }
}
```

**Query Supabase necessarie:**
- `businesses` filtro `created_at > now() - interval '24h'` → nuovi utenti
- `businesses` filtro `plan IN ('trial','starter','pro','flexible','founding_starter','founding_pro')` → business attivi
- `messages` filtro `created_at > now() - interval '24h'` → messaggi ricevuti
- `bookings` filtro `created_at > now() - interval '24h'` → prenotazioni create
- `feedbacks` filtro `created_at > now() - interval '24h'` → feedback raccolti
- `businesses` filtro `plan = 'trial'` e `trial_started_at` → trial in scadenza (≤3 giorni)
- `messages` MAX `created_at` → ora ultimo messaggio (per anomaly detection)
- `bookings` filtro `date = yesterday AND status = 'confirmed' AND feedback_sent_at IS NULL` → se risultati > 0, il cron non è girato

---

### 3. GitHub Actions workflow `.github/workflows/monitoring.yml`

**Job 1: health-check** (ogni 30 minuti)
```
- GET https://ristoagent.com/api/health
- Se status != 200 o timeout > 5s:
    → incrementa contatore fallimenti
    → se 2 fallimenti consecutivi → invia alert Telegram
- Se torna ok dopo un down → invia alert "ripristinato"
```

**Job 2: daily-report** (ogni giorno alle 07:00 UTC = 08:00 ora italiana)
```
- GET https://ristoagent.com/api/health → stato infrastruttura
- GET https://ristoagent.com/api/monitor/report → metriche
- Compone messaggio Telegram formattato
- Invia a OWNER_CHAT_ID via MONITOR_BOT_TOKEN
```

**Repository secrets GitHub necessari:**
- `MONITOR_BOT_TOKEN` = token del bot monitor
- `OWNER_CHAT_ID` = 713891187
- `MONITOR_SECRET` = valore segreto condiviso con Vercel

---

### 4. Anomaly detection in `/api/cron/feedback` (modifica esistente)

Il cron feedback esiste già e gira ogni giorno alle 21:00 UTC. Aggiungere al termine:

1. **Silenzio sospetto:** se ci sono business attivi ma nessun messaggio nelle ultime 6h → invia alert Telegram monitor
2. **Self-check cron:** `/api/monitor/report` verifica se esistono prenotazioni confermate con `date` di ieri e `feedback_sent_at IS NULL`. Se ce ne sono, il cron non è girato. Non serve nessuna tabella aggiuntiva.

---

## Formato messaggi Telegram

### Alert immediato (sito down)
```
🚨 ALERT RISTOAGENT
━━━━━━━━━━━━━━━━━━━
❌ Sito non raggiungibile
⏰ 14:32 — 15 Apr 2026
🔁 2 check consecutivi falliti
━━━━━━━━━━━━━━━━━━━
⚡ Controlla Vercel dashboard
```

### Alert ripristino
```
✅ RIPRISTINATO
Sito tornato online alle 14:51
Down duration: 19 minuti
```

### Alert anomalia
```
⚠️ ANOMALIA RISTOAGENT
━━━━━━━━━━━━━━━━━━━
Nessun messaggio Telegram da 6h
Business attivi: 8
Ultimo messaggio: 08:14
━━━━━━━━━━━━━━━━━━━
Verifica webhook Telegram
```

### Report mattutino
```
📊 Report RistoAgent — 15 Apr 2026

🌐 Infrastruttura
  • Sito: ✅ online (245ms)
  • Database: ✅ ok
  • Cron feedback: ✅ girato ieri alle 21:00

📈 Attività ieri
  • Nuovi utenti: 3
  • Business attivi: 12
  • Messaggi ricevuti: 47
  • Prenotazioni create: 8
  • Feedback raccolti: 5

⚠️ Attenzione
  • Trial in scadenza (3gg): 2
    → Pizzeria Roma (17 apr)
    → Bar Centrale (18 apr)
```

---

## Sicurezza

- `/api/monitor/report` protetto da `x-monitor-secret` header
- `MONITOR_SECRET` salvato come:
  - Variabile d'ambiente Vercel (non esposta al client)
  - GitHub repository secret
- Bot token monitor separato dai bot clienti
- Nessun dato sensibile nei log GitHub Actions

---

## Variabili d'ambiente da aggiungere

**Vercel (env vars):**
```
MONITOR_SECRET=<stringa_casuale_sicura>
MONITOR_BOT_TOKEN=8656359796:AAGQbFQiHpWr_v1RqUujVT5aKz1xgOUok2k
MONITOR_OWNER_CHAT_ID=713891187
```

**GitHub repository secrets:**
```
MONITOR_BOT_TOKEN=8656359796:AAGQbFQiHpWr_v1RqUujVT5aKz1xgOUok2k
OWNER_CHAT_ID=713891187
MONITOR_SECRET=<stessa stringa di Vercel>
APP_URL=https://ristoagent.com
```

---

## File da creare/modificare

| File | Azione |
|------|--------|
| `app/api/health/route.ts` | Nuovo |
| `app/api/monitor/report/route.ts` | Nuovo |
| `.github/workflows/monitoring.yml` | Nuovo |
| `app/api/cron/feedback/route.ts` | Modifica (aggiunge anomaly check) |
| `vercel.json` | Nessuna modifica necessaria |

---

## Costi

| Componente | Costo |
|-----------|-------|
| GitHub Actions | €0 (incluso nel piano gratuito) |
| Vercel endpoints | €0 (già incluso nel piano) |
| Telegram Bot API | €0 |
| **Totale** | **€0** |
