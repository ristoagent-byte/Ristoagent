# Support Chatbot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a floating 💬 chat bubble on all public pages that answers visitor questions using a knowledge base of markdown files + product screenshots, with email forwarding for unanswered questions.

**Architecture:** `components/SupportChat.tsx` (client widget) → `POST /api/chat/support` (streaming SSE, reads `knowledge/` files + screenshots into Claude context) → optional `POST /api/chat/support/forward` (saves to Supabase + sends via Resend). Widget mounted in `app/layout.tsx`, hidden on `/dashboard`.

**Tech Stack:** Next.js 16 App Router, Anthropic SDK (claude-sonnet-4-6), Supabase, Resend, React streaming (ReadableStream / SSE)

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Create | `knowledge/product.md` | What RistoAgent is, how it works |
| Create | `knowledge/pricing.md` | Plans, prices, features |
| Create | `knowledge/onboarding.md` | Setup steps for new users |
| Create | `knowledge/faq.md` | Frequently asked questions |
| Create | `knowledge/screenshots/onboarding-step1.png` | Copy of onboarding UI screenshot |
| Create | `knowledge/screenshots/telegram-bot.png` | Copy of Telegram bot in action |
| Create | `lib/knowledge.ts` | Reads markdown + screenshots, returns context for Claude |
| Create | `app/api/chat/support/route.ts` | Streaming SSE chat endpoint |
| Create | `app/api/chat/support/forward/route.ts` | Email forwarding endpoint |
| Create | `components/SupportChat.tsx` | Floating chat bubble widget |
| Modify | `app/layout.tsx` | Mount `<SupportChat />` before `</body>` |
| Modify | `.env.local` | Add `RESEND_API_KEY` |

---

## Task 1: Install dependency + create knowledge base files

**Files:**
- Modify: `package.json` (via npm install)
- Create: `knowledge/product.md`
- Create: `knowledge/pricing.md`
- Create: `knowledge/onboarding.md`
- Create: `knowledge/faq.md`

- [ ] **Step 1: Install resend**

```bash
cd C:\Users\Admin\OneDrive\RISTOAGENT
npm install resend
```

Expected output: `added 1 package`

- [ ] **Step 2: Create `knowledge/product.md`**

```markdown
# RistoAgent — Cos'è e come funziona

## Cosa è RistoAgent
RistoAgent è un servizio SaaS italiano che crea bot Telegram automatici per attività locali: ristoranti, bar, parrucchieri, estetisti, palestre, studi medici e molto altro.

Il bot risponde ai messaggi dei clienti 24 ore su 24, 7 giorni su 7 — anche di notte, nei weekend e durante le ore di punta — gestendo prenotazioni, domande frequenti e conferme senza che il titolare debba toccare il telefono.

## Per chi è pensato
- Ristoranti e pizzerie che ricevono molte richieste di prenotazione su Telegram
- Bar e caffetterie che vogliono comunicare orari, menù e promozioni
- Parrucchieri e centri estetici che gestiscono appuntamenti
- Palestre e studi fitness che offrono sessioni individuali
- Studi medici e dentisti che prendono appuntamenti
- Qualsiasi attività locale che vuole rispondere automaticamente ai clienti

## Come funziona in 3 passi
1. **Configura**: inserisci il nome della tua attività, i servizi offerti, gli orari e colleghi il tuo Google Calendar
2. **Connetti**: crei un bot Telegram con BotFather (gratuito) e inserisci il token in RistoAgent
3. **Attiva**: il bot è pronto. I tuoi clienti gli scrivono su Telegram e ricevono risposte automatiche immediate

## Cosa fa il bot
- Risponde a domande su orari, servizi, prezzi
- Raccoglie data, ora, numero di persone e nome del cliente per le prenotazioni
- Verifica la disponibilità sul Google Calendar del titolare
- Conferma la prenotazione in chat e aggiunge l'evento al calendario
- Invia il link Google Maps dell'attività dopo ogni prenotazione confermata
- Risponde in italiano o inglese a seconda di come scrive il cliente

## Cosa NON fa (ancora)
- Non gestisce pagamenti online
- Non funziona su WhatsApp (solo Telegram per ora)
- Non gestisce più sedi simultaneamente (un bot per attività)

## Tecnologia
RistoAgent è alimentato da Claude AI (Anthropic) — uno dei modelli di intelligenza artificiale più avanzati al mondo — garantendo risposte naturali, precise e contestuali.
```

- [ ] **Step 3: Create `knowledge/pricing.md`**

```markdown
# RistoAgent — Piani e Prezzi

## Prova gratuita
- **15 giorni gratuiti** — nessuna carta di credito richiesta
- Una prova per attività (verificata tramite P.IVA o Codice Fiscale)
- Accesso completo a tutte le funzionalità durante il trial
- Dopo 15 giorni si sceglie un piano o si smette di usare il servizio

## Piano Starter — €29/mese
- Rinnovo mensile automatico
- 300 operazioni/mese (messaggi elaborati dall'AI)
- 1 Bot Telegram
- Integrazione Google Calendar
- FAQ automatiche
- Setup guidato
- Ideale per: attività piccole con traffico moderato e clienti abituali

## Piano Flessibile — €39/mese
- **Nessun rinnovo automatico** — paghi solo i mesi che usi
- 500 operazioni/mese
- 1 Bot Telegram
- Integrazione Google Calendar
- FAQ automatiche
- Puoi attivare e disattivare quando vuoi
- Ideale per: attività stagionali o chi preferisce non avere abbonamenti fissi

## Piano Pro — €49/mese ⭐ (più popolare)
- Rinnovo mensile automatico
- **Operazioni illimitate**
- 1 Bot Telegram
- Integrazione Google Calendar
- Analisi e report delle conversazioni
- Supporto prioritario
- Ideale per: attività in crescita con alto volume di messaggi

## Domande sui pagamenti
- I pagamenti sono gestiti da Stripe (sicuro, standard internazionale)
- Si può disdire in qualsiasi momento dal pannello di controllo
- Non ci sono costi nascosti o commissioni sulle prenotazioni
- Per fatturazione o questioni fiscali: info@ristoagent.com
```

- [ ] **Step 4: Create `knowledge/onboarding.md`**

```markdown
# RistoAgent — Come configurare il tuo bot (Onboarding)

L'onboarding guidato è diviso in 5 step e richiede circa 10-15 minuti.

## Step 1: La tua attività
- Inserisci il nome della tua attività (es. "Trattoria da Mario")
- Seleziona il tipo di attività (puoi selezionarne più di uno)
- Inserisci la Partita IVA o Codice Fiscale — serve solo per verificare l'unicità della prova gratuita (una per attività). Non viene usata per fatturazione.

## Step 2: Servizi & Orari
Rispondi a 3 domande fondamentali che l'AI userà per rispondere ai clienti:
1. **Quali servizi/prodotti offri?** (con prezzi se disponibili)
   - es. "Pizza margherita €8, Pizza diavola €9, Tiramisù €4"
2. **Orari e disponibilità**
   - es. "Aperto lun-ven 12:00-15:00 e 19:00-23:00, chiuso domenica"
   - Specifica anche i giorni di chiusura e le regole di prenotazione
3. **Informazioni pratiche extra** (facoltativo)
   - Parcheggio, accessibilità, modalità di pagamento, ecc.

💡 **Consiglio**: più informazioni dai, migliore sarà la qualità delle risposte del bot

## Step 3: Google Calendar (opzionale ma raccomandato)
- Collega il tuo Google Calendar per gestire le prenotazioni automaticamente
- Il bot verificherà la disponibilità prima di confermare ogni prenotazione
- Le prenotazioni confermate vengono aggiunte automaticamente al calendario
- Clicca "Connetti Google Calendar" e segui il flusso OAuth di Google
- Se non hai Google Calendar puoi saltare questo step (il bot non gestirà prenotazioni)

## Step 4: Bot Telegram
Per creare il tuo bot Telegram:
1. Apri Telegram e cerca **@BotFather**
2. Scrivi `/newbot`
3. Dai un nome al bot (es. "Trattoria da Mario")
4. Dai un username al bot (deve finire in "bot", es. "trattoriamario_bot")
5. BotFather ti invierà un **token** — copialo
6. Incolla il token nel campo di RistoAgent e clicca "Attiva Bot"

## Step 5: Attiva
- Il bot è attivo! Scarica il QR code da condividere con i clienti
- Puoi condividerlo su WhatsApp, Instagram, biglietti da visita, menù, ecc.
- I clienti scansionano il QR e si aprono direttamente in chat con il bot

## Dopo l'onboarding: caricare il menù o altri documenti
Dalla dashboard → tab Impostazioni → "Carica documento (PDF, Word, Excel, TXT)"
- Puoi caricare il menù completo, il listino prezzi, o qualsiasi documento
- Il bot leggerà il documento e lo userà per rispondere ai clienti
- Max 5MB, max 20.000 caratteri di testo estratto
```

- [ ] **Step 5: Create `knowledge/faq.md`**

```markdown
# RistoAgent — Domande Frequenti (FAQ)

## Funziona su WhatsApp?
No, al momento RistoAgent funziona solo su Telegram. Telegram è gratuito, molto diffuso in Italia, e permette di creare bot ufficiali. WhatsApp non supporta bot di terze parti. Stiamo valutando l'integrazione WhatsApp per il futuro.

## Devo essere un tecnico per configurarlo?
No. L'onboarding guidato ti porta attraverso tutti i passaggi in 10-15 minuti, senza conoscenze tecniche. Se hai qualche dubbio puoi scrivere a info@ristoagent.com.

## Quanto tempo ci vuole per attivare il bot?
Con tutti i dati a portata di mano: circa 10-15 minuti. Il tempo più lungo è la creazione del bot su BotFather (5 minuti).

## Il bot risponde solo in italiano?
No. Il bot rileva automaticamente la lingua del cliente e risponde nella stessa lingua. Funziona in italiano e inglese.

## Cosa succede se il cliente fa una domanda che il bot non sa rispondere?
Il bot dice onestamente che non ha quella informazione e invita il cliente a contattare direttamente l'attività. Non inventa mai risposte.

## Posso personalizzare le risposte del bot?
Le risposte del bot si basano sulle informazioni che hai inserito durante la configurazione. Più dettagli fornisci (servizi, prezzi, regole, FAQ specifiche), più preciso sarà il bot. Puoi anche caricare un documento con il menù o il listino prezzi.

## Come funziona la verifica della disponibilità?
Se hai collegato Google Calendar, prima di confermare una prenotazione il bot controlla automaticamente se c'è disponibilità nell'orario richiesto. Se non è disponibile, propone alternative.

## Posso disattivare il bot temporaneamente?
Sì. Con il Piano Flessibile non hai rinnovo automatico — smetti di pagare e il bot si disattiva. Con Starter e Pro puoi disdire dal pannello di controllo in qualsiasi momento senza penali.

## La prova gratuita richiede la carta di credito?
No. I 15 giorni di prova sono completamente gratuiti, senza inserire dati di pagamento. Solo al termine della prova ti viene chiesto di scegliere un piano.

## Posso usare RistoAgent per un'attività non italiana?
RistoAgent è pensato per attività in Italia (la verifica usa P.IVA/Codice Fiscale italiano), ma funziona tecnicamente anche altrove. Il bot risponde in italiano e inglese.

## Cosa sono le "operazioni"?
Ogni messaggio elaborato dall'AI conta come un'operazione. Una conversazione con 10 messaggi = 10 operazioni. Il Piano Pro ha operazioni illimitate.

## Come posso contattare il supporto?
Scrivi a info@ristoagent.com — risposta garantita entro 24 ore nei giorni lavorativi.

## Posso provare il bot prima di iscrivermi?
Puoi iniziare la prova gratuita di 15 giorni senza carta di credito. Non esiste una demo pubblica del bot, ma durante i 15 giorni hai accesso completo.

## I dati dei miei clienti sono al sicuro?
Sì. I dati sono conservati su Supabase (infrastruttura europea) con crittografia. Non vendiamo dati a terzi. Vedi la Privacy Policy su ristoagent.com/privacy.
```

- [ ] **Step 6: Copy screenshots**

Copy these two files manually:
- From: `C:\Users\Admin\Pictures\Screenshots\Screenshot 2026-04-13 193259.png`
- To: `C:\Users\Admin\OneDrive\RISTOAGENT\knowledge\screenshots\onboarding-step1.png`

- From: `C:\Users\Admin\Pictures\Screenshots\telegram_chat_only.png`
- To: `C:\Users\Admin\OneDrive\RISTOAGENT\knowledge\screenshots\telegram-bot.png`

```bash
mkdir -p knowledge/screenshots
cp "C:/Users/Admin/Pictures/Screenshots/Screenshot 2026-04-13 193259.png" knowledge/screenshots/onboarding-step1.png
cp "C:/Users/Admin/Pictures/Screenshots/telegram_chat_only.png" knowledge/screenshots/telegram-bot.png
```

- [ ] **Step 7: Verify files exist**

```bash
ls knowledge/
ls knowledge/screenshots/
```

Expected:
```
faq.md  onboarding.md  pricing.md  product.md  screenshots/
onboarding-step1.png  telegram-bot.png
```

- [ ] **Step 8: Commit**

```bash
git add knowledge/ package.json package-lock.json
git commit -m "feat: add knowledge base files and resend dependency"
```

---

## Task 2: Knowledge helper (`lib/knowledge.ts`)

**Files:**
- Create: `lib/knowledge.ts`

This helper reads all `.md` files from `knowledge/` and loads screenshots as base64 for use in the Claude API call.

- [ ] **Step 1: Create `lib/knowledge.ts`**

```typescript
import fs from "fs";
import path from "path";
import type Anthropic from "@anthropic-ai/sdk";

const KNOWLEDGE_DIR = path.join(process.cwd(), "knowledge");
const SCREENSHOTS_DIR = path.join(KNOWLEDGE_DIR, "screenshots");

export function loadKnowledgeText(): string {
  const files = fs.readdirSync(KNOWLEDGE_DIR).filter((f) => f.endsWith(".md"));
  return files
    .map((f) => fs.readFileSync(path.join(KNOWLEDGE_DIR, f), "utf-8"))
    .join("\n\n---\n\n");
}

export function loadScreenshots(): Anthropic.ImageBlockParam[] {
  if (!fs.existsSync(SCREENSHOTS_DIR)) return [];
  const files = fs
    .readdirSync(SCREENSHOTS_DIR)
    .filter((f) => f.endsWith(".png") || f.endsWith(".jpg"))
    .slice(0, 5); // max 5 images to control cost

  return files.map((f) => ({
    type: "image" as const,
    source: {
      type: "base64" as const,
      media_type: "image/png" as const,
      data: fs.readFileSync(path.join(SCREENSHOTS_DIR, f)).toString("base64"),
    },
  }));
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add lib/knowledge.ts
git commit -m "feat: add knowledge base loader helper"
```

---

## Task 3: Streaming chat API (`/api/chat/support`)

**Files:**
- Create: `app/api/chat/support/route.ts`

This endpoint receives a message + history, builds the Claude prompt with the full knowledge base + screenshots, and streams the response back as Server-Sent Events.

- [ ] **Step 1: Create `app/api/chat/support/route.ts`**

```typescript
import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { loadKnowledgeText, loadScreenshots } from "@/lib/knowledge";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const SENTINEL = "Non ho informazioni su questo";

export async function POST(req: NextRequest) {
  const { message, history = [] } = await req.json() as {
    message: string;
    history: Array<{ role: "user" | "assistant"; content: string }>;
  };

  if (!message || message.trim().length === 0) {
    return new Response(JSON.stringify({ error: "Messaggio vuoto" }), { status: 400 });
  }

  const knowledgeText = loadKnowledgeText();
  const screenshots = loadScreenshots();

  const systemPrompt = `Sei l'assistente di supporto di RistoAgent, un servizio che crea bot Telegram automatici per attività locali italiane.

Il tuo compito è rispondere a domande su: cos'è RistoAgent, come funziona, i piani e prezzi, come configurarlo.

Tono: professionale ma caldo. Rispondi in italiano, a meno che il visitatore non scriva in inglese — in quel caso rispondi in inglese.

Se non hai informazioni sufficienti per rispondere, di' esattamente questa frase (in italiano o inglese a seconda della lingua dell'utente):
- Italiano: "${SENTINEL}. Posso inoltrare il tuo messaggio al nostro team — risponderemo entro 24 ore."
- Inglese: "I don't have information on this. I can forward your message to our team — we'll respond within 24 hours."

Non inventare mai informazioni. Non rispondere a domande non legate a RistoAgent.

Qui sotto trovi tutta la documentazione di RistoAgent e alcuni screenshot del prodotto:

${knowledgeText}`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Build message content: screenshots first, then the user's text
        const userContent: Anthropic.ContentBlockParam[] = [
          ...screenshots,
          { type: "text", text: message },
        ];

        const messages: Anthropic.MessageParam[] = [
          // Include last 6 history messages for context
          ...history.slice(-6).map((h) => ({
            role: h.role,
            content: h.content,
          })),
          { role: "user", content: userContent },
        ];

        const claudeStream = anthropic.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 600,
          system: systemPrompt,
          messages,
        });

        for await (const event of claudeStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            const chunk = JSON.stringify({ delta: event.delta.text });
            controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
          }
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Errore";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Quick manual test (dev server)**

```bash
npm run dev
```

In another terminal:
```bash
curl -X POST http://localhost:3000/api/chat/support \
  -H "Content-Type: application/json" \
  -d '{"message":"quanto costa il piano Pro?","history":[]}' \
  --no-buffer
```

Expected: stream of `data: {"delta":"..."}` lines ending with `data: [DONE]`

- [ ] **Step 4: Commit**

```bash
git add app/api/chat/support/route.ts
git commit -m "feat: add streaming support chat API endpoint"
```

---

## Task 4: Email forwarding API (`/api/chat/support/forward`)

**Files:**
- Create: `app/api/chat/support/forward/route.ts`

Saves the unanswered question to Supabase and sends an email notification via Resend.

**Prerequisites:** Run this SQL in Supabase SQL Editor before testing:
```sql
CREATE TABLE support_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  message text NOT NULL,
  bot_reply text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE support_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only" ON support_requests
  USING (false) WITH CHECK (false);
```

Also add to `.env.local`:
```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
```
(Get a free API key at resend.com — no domain verification needed to send to info@ristoagent.com using the default sender)

- [ ] **Step 1: Create `app/api/chat/support/forward/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createServerClient } from "@/lib/supabase-server";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: NextRequest) {
  const { email, message, botReply } = await req.json() as {
    email: string;
    message: string;
    botReply?: string;
  };

  if (!email || !message) {
    return NextResponse.json({ error: "Email e messaggio obbligatori" }, { status: 400 });
  }

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email non valida" }, { status: 400 });
  }

  const supabase = createServerClient();

  // Save to Supabase
  await supabase.from("support_requests").insert({
    email,
    message,
    bot_reply: botReply ?? null,
  });

  // Send email notification
  try {
    await resend.emails.send({
      from: "RistoAgent Support <onboarding@resend.dev>",
      to: "info@ristoagent.com",
      subject: `Nuova richiesta di supporto da ${email}`,
      html: `
        <h2>Nuova richiesta di supporto</h2>
        <p><strong>Da:</strong> ${email}</p>
        <p><strong>Messaggio:</strong></p>
        <blockquote style="border-left:3px solid #0EA5E9;padding-left:12px;color:#555">${message}</blockquote>
        ${botReply ? `<p><strong>Risposta del bot (non sufficiente):</strong></p><blockquote style="border-left:3px solid #ccc;padding-left:12px;color:#888">${botReply}</blockquote>` : ""}
        <hr/>
        <p style="color:#888;font-size:12px">Rispondi direttamente a questo messaggio o scrivi a ${email}</p>
      `,
      replyTo: email,
    });
  } catch {
    // Email failure is non-blocking — the request is already saved to Supabase
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/api/chat/support/forward/route.ts
git commit -m "feat: add support email forwarding endpoint"
```

---

## Task 5: SupportChat widget (`components/SupportChat.tsx`)

**Files:**
- Create: `components/SupportChat.tsx`

The floating bubble + chat window. Uses SSE to stream responses from `/api/chat/support`. Detects the sentinel phrase to show the "forward to team" button. Hidden on `/dashboard`.

- [ ] **Step 1: Create `components/SupportChat.tsx`**

```typescript
"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

const SENTINEL_IT = "Non ho informazioni su questo";
const SENTINEL_EN = "I don't have information on this";

type Msg = {
  role: "user" | "assistant";
  content: string;
  isForwardPrompt?: boolean;
};

export default function SupportChat() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content: "Ciao! 👋 Sono l'assistente di RistoAgent. Posso risponderti su come funziona il servizio, i piani e la configurazione. Come posso aiutarti?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [forwardEmail, setForwardEmail] = useState("");
  const [forwardLoading, setForwardLoading] = useState(false);
  const [forwardSent, setForwardSent] = useState(false);
  const [pendingForwardMessage, setPendingForwardMessage] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Get logged-in user email if available
  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setUserEmail(data.user.email);
    });
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Hide on dashboard — logged-in users have support via email directly
  if (pathname?.startsWith("/dashboard")) return null;

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setForwardSent(false);

    const userMsg: Msg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    const history = newMessages.slice(-7, -1).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await fetch("/api/chat/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });

      if (!res.body) throw new Error("No stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      const assistantMsg: Msg = { role: "assistant", content: "" };
      setMessages((prev) => [...prev, assistantMsg]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value).split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.delta) {
              fullText += parsed.delta;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: fullText };
                return updated;
              });
            }
          } catch { /* ignore parse errors */ }
        }
      }

      // Check if bot doesn't know — show forward option
      const cantAnswer =
        fullText.includes(SENTINEL_IT) || fullText.includes(SENTINEL_EN);
      if (cantAnswer) {
        setPendingForwardMessage(text);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "__forward__", isForwardPrompt: true },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Errore di connessione. Riprova tra un momento." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleForward() {
    const email = userEmail ?? forwardEmail.trim();
    if (!email || !pendingForwardMessage) return;
    setForwardLoading(true);

    await fetch("/api/chat/support/forward", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        message: pendingForwardMessage,
        botReply: messages.findLast((m) => m.role === "assistant" && !m.isForwardPrompt)?.content,
      }),
    });

    setForwardLoading(false);
    setForwardSent(true);
    setPendingForwardMessage(null);
    setMessages((prev) =>
      prev.map((m) =>
        m.isForwardPrompt
          ? { role: "assistant", content: "✅ Messaggio inviato! Ti risponderemo entro 24 ore." }
          : m
      )
    );
  }

  const s = {
    bubble: {
      position: "fixed" as const,
      bottom: 24,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: "50%",
      background: "#0EA5E9",
      border: "none",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "1.4rem",
      boxShadow: "0 4px 24px rgba(14,165,233,0.4)",
      zIndex: 9999,
      transition: "transform 0.2s",
    },
    window: {
      position: "fixed" as const,
      bottom: 90,
      right: 24,
      width: 370,
      height: 500,
      background: "#0f1610",
      border: "1px solid #1e2b20",
      borderRadius: "1.2rem",
      display: "flex",
      flexDirection: "column" as const,
      zIndex: 9999,
      boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
      fontFamily: "'DM Sans','Segoe UI',sans-serif",
      overflow: "hidden",
    },
  };

  return (
    <>
      {/* Bubble */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={s.bubble}
        aria-label="Apri chat supporto"
      >
        {open ? "✕" : "💬"}
      </button>

      {/* Chat window */}
      {open && (
        <div style={s.window}>
          {/* Header */}
          <div style={{
            padding: "1rem 1.2rem",
            borderBottom: "1px solid #1e2b20",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "#0EA5E9",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.9rem",
            }}>🤖</div>
            <div>
              <p style={{ fontSize: "0.88rem", fontWeight: 600, color: "#e8f0e9", margin: 0 }}>
                Assistente RistoAgent
              </p>
              <p style={{ fontSize: "0.72rem", color: "#4ade80", margin: 0 }}>● online</p>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}>
            {messages.map((m, i) => (
              <div key={i}>
                {m.isForwardPrompt ? (
                  // Forward prompt UI
                  <div style={{
                    background: "#131a14",
                    border: "1px solid #1e2b20",
                    borderRadius: "0.8rem",
                    padding: "0.8rem",
                  }}>
                    {forwardSent ? (
                      <p style={{ color: "#4ade80", fontSize: "0.84rem", margin: 0 }}>
                        ✅ Messaggio inviato! Ti risponderemo entro 24 ore.
                      </p>
                    ) : (
                      <>
                        <p style={{ color: "#7a9b7e", fontSize: "0.82rem", marginBottom: "0.6rem" }}>
                          Vuoi che inoltriamo la tua domanda al team?
                        </p>
                        {!userEmail && (
                          <input
                            type="email"
                            placeholder="La tua email"
                            value={forwardEmail}
                            onChange={(e) => setForwardEmail(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "0.5rem 0.75rem",
                              background: "#0a0f0d",
                              border: "1px solid #1e2b20",
                              borderRadius: "0.5rem",
                              color: "#e8f0e9",
                              fontSize: "0.82rem",
                              fontFamily: "inherit",
                              marginBottom: "0.5rem",
                              boxSizing: "border-box" as const,
                              outline: "none",
                            }}
                          />
                        )}
                        {userEmail && (
                          <p style={{ color: "#7a9b7e", fontSize: "0.78rem", marginBottom: "0.5rem" }}>
                            Risponderemo a: {userEmail}
                          </p>
                        )}
                        <button
                          onClick={handleForward}
                          disabled={forwardLoading || (!userEmail && !forwardEmail.trim())}
                          style={{
                            width: "100%",
                            padding: "0.5rem",
                            background: "#0EA5E9",
                            border: "none",
                            borderRadius: "0.5rem",
                            color: "#fff",
                            fontSize: "0.82rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            opacity: forwardLoading ? 0.6 : 1,
                          }}
                        >
                          {forwardLoading ? "Invio..." : "Sì, invia al team →"}
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  // Regular message bubble
                  <div style={{
                    display: "flex",
                    justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                  }}>
                    <div style={{
                      maxWidth: "82%",
                      padding: "0.6rem 0.9rem",
                      borderRadius: m.role === "user"
                        ? "1rem 1rem 0.2rem 1rem"
                        : "1rem 1rem 1rem 0.2rem",
                      background: m.role === "user" ? "#0EA5E9" : "#1a2b1e",
                      color: "#e8f0e9",
                      fontSize: "0.84rem",
                      lineHeight: 1.5,
                      whiteSpace: "pre-wrap",
                    }}>
                      {m.content}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div style={{ display: "flex", gap: "4px", paddingLeft: "4px" }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{
                    width: 7, height: 7, borderRadius: "50%",
                    background: "#0EA5E9",
                    animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: "0.75rem 1rem",
            borderTop: "1px solid #1e2b20",
            display: "flex",
            gap: "0.5rem",
          }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Scrivi un messaggio..."
              disabled={loading}
              style={{
                flex: 1,
                padding: "0.55rem 0.85rem",
                background: "#131a14",
                border: "1px solid #1e2b20",
                borderRadius: "999px",
                color: "#e8f0e9",
                fontSize: "0.84rem",
                fontFamily: "inherit",
                outline: "none",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                width: 36, height: 36,
                borderRadius: "50%",
                background: input.trim() ? "#0EA5E9" : "#1e2b20",
                border: "none",
                cursor: input.trim() ? "pointer" : "default",
                color: "#fff",
                fontSize: "0.9rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "background 0.2s",
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* Bounce animation for typing dots */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/SupportChat.tsx
git commit -m "feat: add SupportChat floating widget component"
```

---

## Task 6: Mount widget in layout + add env var

**Files:**
- Modify: `app/layout.tsx`
- Modify: `.env.local`

- [ ] **Step 1: Update `app/layout.tsx`**

Replace the entire file with:

```typescript
import "./globals.css";
import SupportChat from "@/components/SupportChat";

export const metadata = {
  title: "RistoAgent",
  description: "AI per ristoranti",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body>
        {children}
        <SupportChat />
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Add RESEND_API_KEY to `.env.local`**

Sign up at resend.com (free), create an API key, then add to `.env.local`:
```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Test locally**

```bash
npm run dev
```

Open http://localhost:3000 in browser:
1. ✅ Bubble 💬 visible bottom-right
2. ✅ Click opens chat window with welcome message
3. ✅ Ask "quanto costa il piano Pro?" → streamed reply mentioning €49
4. ✅ Ask "qual è il tuo colore preferito?" → bot says it can't answer, shows forward button
5. ✅ Click "Sì, invia al team →" → shows email input (if not logged in) → sends → "✅ Messaggio inviato!"
6. ✅ Navigate to http://localhost:3000/dashboard → bubble NOT visible
7. ✅ Press Enter to send message (keyboard shortcut works)

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx .env.local
git commit -m "feat: mount SupportChat in layout, add RESEND_API_KEY"
```

---

## Task 7: Deploy to production

**Files:**
- Modify: Vercel env vars (via CLI)

- [ ] **Step 1: Add RESEND_API_KEY to Vercel**

```bash
vercel env add RESEND_API_KEY production
```

When prompted, paste the API key value.

- [ ] **Step 2: Deploy**

```bash
vercel --prod
```

Expected: build passes, deployed to ristoagent.com

- [ ] **Step 3: Smoke test on production**

Open https://ristoagent.com:
1. ✅ Bubble visible
2. ✅ Ask "cosa fa RistoAgent?" → correct answer
3. ✅ Ask something unknown → forward option appears
4. ✅ Enter email + send → confirmation message

- [ ] **Step 4: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: production smoke test fixes"
```
