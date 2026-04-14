# RistoAgent Support Chatbot — Design Spec

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Aggiungere un chatbot di supporto flottante su tutte le pagine pubbliche di RistoAgent, alimentato da una knowledge base testuale + screenshot del prodotto, con possibilità di inoltrare domande senza risposta a info@ristoagent.com.

**Architecture:** Widget React (`SupportChat.tsx`) montato in `app/layout.tsx`, che chiama `/api/chat/support` (streaming). L'API legge i file markdown da `knowledge/` e include screenshot selezionati come immagini nel contesto Claude. Se il bot non sa rispondere, propone l'inoltro email: salva in Supabase e invia via Resend.

**Tech Stack:** Next.js App Router, Anthropic SDK (claude-sonnet-4-6), Supabase, Resend, React streaming (ReadableStream)

---

## Knowledge Base (`knowledge/`)

### File creati manualmente (da me, al momento dell'implementazione):

| File | Contenuto |
|------|-----------|
| `knowledge/product.md` | Cos'è RistoAgent, per chi è, come funziona in 3 passi |
| `knowledge/pricing.md` | Piani Starter €29/mese, Pro €49/mese, Flessibile €39/mese — features e differenze |
| `knowledge/onboarding.md` | Come configurare il bot: P.IVA, token Telegram, Google Calendar |
| `knowledge/faq.md` | Domande frequenti: funziona su WhatsApp? serve un tecnico? quanto ci vuole? ecc. |
| `knowledge/screenshots/` | Screenshot rilevanti copiati da `C:/Users/Admin/Pictures/Screenshots/` |

### Selezione screenshot
Al momento dell'implementazione, analizzare gli screenshot disponibili e copiare nella cartella `knowledge/screenshots/` quelli che mostrano:
- La dashboard di RistoAgent
- Il flusso di onboarding (step 1-5)
- Il bot Telegram in azione
- La pagina upgrade/piani
- La landing page

---

## API Route `/api/chat/support`

### Request
```ts
POST /api/chat/support
Content-Type: application/json

{
  message: string,          // messaggio corrente utente
  history: Array<{role: "user"|"assistant", content: string}>,  // max ultimi 6 messaggi
  userEmail?: string        // se utente loggato, passata dal client
}
```

### Behavior
1. Legge tutti i file `.md` da `knowledge/` concatenandoli in un system prompt
2. Carica le immagini da `knowledge/screenshots/` come base64 (max 5 immagini, ridimensionate se >1MB)
3. Chiama `anthropic.messages.stream()` con model `claude-sonnet-4-6`
4. Risponde in streaming (Server-Sent Events)

### System prompt
```
Sei l'assistente di supporto di RistoAgent, un servizio che crea bot Telegram automatici per attività locali italiane.

Il tuo compito è rispondere a domande su: cos'è RistoAgent, come funziona, i piani e prezzi, come configurarlo.

Tono: professionale ma caldo, italiano.

Se non sai rispondere a una domanda, di' esattamente:
"Non ho informazioni su questo. Posso inoltrare il tuo messaggio al nostro team — risponderemo entro 24 ore."

Non inventare informazioni. Non rispondere a domande fuori contesto (es. ricette, codice, argomenti non legati a RistoAgent).

[KNOWLEDGE BASE]
{contenuto dei file markdown}
```

### Streaming response
```ts
// Usa ReadableStream con TextEncoder
// Ogni chunk: `data: {"delta": "testo"}\n\n`
// Fine stream: `data: [DONE]\n\n`
```

### Limiti
- Max 500 token di input per messaggio utente
- Max 6 messaggi di history
- Timeout 30s

---

## Inoltro Email

### Trigger
Il frontend rileva quando la risposta del bot contiene la frase sentinella `"Non ho informazioni su questo"` e mostra un pulsante **"Sì, invia al team →"**.

### Flow
1. Utente clicca il pulsante
2. Se `userEmail` presente → procede; altrimenti mostra input email
3. Frontend chiama `POST /api/chat/support/forward` con `{ email, message, botReply }`
4. API:
   - Salva in Supabase tabella `support_requests(id, email, message, bot_reply, created_at)`
   - Invia email a `info@ristoagent.com` via Resend
5. Mostra messaggio di conferma: *"Messaggio inviato! Ti risponderemo entro 24 ore."*

### Supabase table (SQL da eseguire manualmente)
```sql
CREATE TABLE support_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  message text NOT NULL,
  bot_reply text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE support_requests ENABLE ROW LEVEL SECURITY;
-- Solo service_role può leggere/scrivere
CREATE POLICY "service_role_only" ON support_requests
  USING (false) WITH CHECK (false);
```

---

## Widget UI (`components/SupportChat.tsx`)

### Struttura visiva
- **Bubble chiusa:** bottone tondo 56px in basso a destra, colore `#0EA5E9`, icona 💬, z-index 9999
- **Finestra aperta:** card 380×500px, stessa palette del sito (sfondo `#0f1610`, bordo `#1e2b20`)
  - Header: logo piccolo + "Assistente RistoAgent" + pulsante chiudi ✕
  - Area messaggi scrollabile
  - Input + bottone invio
  - Messaggio di benvenuto automatico all'apertura

### Messaggio di benvenuto
> "Ciao! 👋 Sono l'assistente di RistoAgent. Posso risponderti su come funziona il servizio, i piani e la configurazione. Come posso aiutarti?"

### Stati UI
- `idle` → bubble visibile
- `open` → finestra aperta, messaggi visibili
- `loading` → indicatore di digitazione (3 puntini animati, già presente nel CSS del sito)
- `forwarding` → mostra input email se necessario + bottone invio
- `sent` → messaggio conferma verde

### Integrazione layout
```tsx
// app/layout.tsx — aggiungere prima di </body>
import SupportChat from "@/components/SupportChat";
// ...
<SupportChat />
```

Il componente è `"use client"` e usa `usePathname()` per verificare di non montarsi sulla dashboard (utenti già iscritti non hanno bisogno del bot di supporto pre-vendita).

---

## Installazione dipendenza
```bash
npm install resend
```

Variabile d'ambiente da aggiungere:
```
RESEND_API_KEY=re_xxxxxxxxxxxx
```

---

## Testing
1. Aprire `http://localhost:3000` → bubble visibile in basso a destra
2. Cliccare → finestra si apre con messaggio di benvenuto
3. Chiedere "quanto costa il piano Pro?" → risposta corretta da knowledge base
4. Chiedere qualcosa di sconosciuto → bot propone inoltro → inserire email → conferma invio
5. Verificare riga in Supabase `support_requests` + email in arrivo su `info@ristoagent.com`
6. Verificare che sulla `/dashboard` la bubble NON appaia
