# RistoAgent — Telegram Pivot Design

**Date:** 2026-04-11
**Status:** Approved

## Context

RistoAgent is a SaaS platform for Italian local businesses (restaurants, barbers, beauty centers, etc.) that automates customer communication. The original implementation used WhatsApp Business API via Meta, but the owner's Meta Business account is blocked. This spec covers the full pivot to Telegram as the messaging channel.

---

## Goals

- Replace WhatsApp with a Telegram Bot as the customer communication channel
- Automate replies using Claude API (Anthropic) with automatic IT/EN language detection
- Integrate Google Calendar for automatic booking management
- Provide a dashboard for business owners to monitor conversations and bookings
- Generate a downloadable QR code for each bot link (for use on social, flyers, menus)
- Provide contextual tutorials at every step so any business owner can complete setup independently
- Keep architecture simple: single Next.js project deployable on Vercel
- UX principle: zero technical jargon, every action explains why it is needed

---

## Architecture

**Stack:**
- Frontend + API: Next.js (existing project)
- Database: Supabase
- AI: Claude API (claude-sonnet-4-6)
- Messaging: Telegram Bot API
- Calendar: Google Calendar API
- Auth: Supabase Auth (email/password, Google OAuth, Telegram login)
- QR Code: `qrcode` npm library (client-side generation, PNG download)
- Color: #0EA5E9 (sky blue) as primary brand color replacing WhatsApp green
- Hosting: Vercel

**Message flow:**
```
Customer writes to Telegram bot
        ↓ webhook POST
/api/telegram/webhook  (Next.js API route)
        ↓
  [1] Save incoming message to Supabase
  [2] Detect language (IT/EN) from message text
  [3] Fetch business config from Supabase
  [4] Call Claude API with personalized system prompt
  [5] If booking request → Google Calendar API (check availability + create event)
  [6] Reply to customer via Telegram Bot API
  [7] Save AI response to Supabase
        ↓
Dashboard (Next.js) reads from Supabase in real-time
```

---

## Database Schema (Supabase)

### `businesses`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK → auth.users |
| name | text | Business name |
| type | text | e.g. "Ristorante / Pizzeria" |
| services | text | Free text description |
| opening_hours | text | Free text description |
| telegram_bot_token | text | From BotFather |
| telegram_bot_username | text | e.g. "trattoria_mario_bot" |
| google_access_token | text | OAuth token |
| google_refresh_token | text | OAuth refresh token |
| google_calendar_id | text | Target calendar |
| plan | text | "starter" or "pro" |
| created_at | timestamptz | |

### `conversations`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| business_id | uuid | FK → businesses |
| telegram_chat_id | text | Customer's Telegram chat ID |
| customer_name | text | Telegram display name |
| language | text | "it" or "en" |
| last_message_at | timestamptz | |
| created_at | timestamptz | |

### `messages`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| conversation_id | uuid | FK → conversations |
| text | text | Message content |
| sender | text | "customer" or "ai" |
| created_at | timestamptz | |

### `bookings`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| business_id | uuid | FK → businesses |
| conversation_id | uuid | FK → conversations |
| customer_name | text | |
| date | date | |
| time | time | |
| party_size | integer | |
| google_event_id | text | Google Calendar event ID |
| status | text | "confirmed" / "cancelled" |
| created_at | timestamptz | |

---

## Onboarding Wizard (5 Steps)

### Step 1 — La tua attività
- Business name (text input)
- Business type (grid selector: Ristorante/Pizzeria, Bar/Caffetteria, Agriturismo, Parrucchiere/Barbiere, Centro Estetico/SPA, Palestra/Studio Fitness, Studio Medico/Dentista, Altro)

### Step 2 — Servizi & Orari
- Services offered (textarea)
- Opening hours (textarea)

### Step 3 — Collega Google Calendar
- "Accedi con Google" button → Google OAuth (scope: `calendar.events`, `calendar.readonly`)
- On success: store access_token + refresh_token in Supabase
- Show confirmation: "Google Calendar collegato ✓"
- Explain: "RistoAgent userà questo calendario per verificare disponibilità e creare prenotazioni automaticamente"

### Step 4 — Crea il tuo Bot Telegram
Step-by-step instructions (with numbered visual steps in the UI):
1. Open Telegram → search @BotFather
2. Send `/newbot`
3. Choose a name (e.g. "Trattoria da Mario")
4. Choose a username ending in "bot" (e.g. "trattoria_mario_bot")
5. Copy the token BotFather provides
- Token input field: paste token here
- On save: RistoAgent calls `setWebhook` on Telegram API automatically
- Show confirmation: "Bot attivato ✓ — t.me/nome_bot"

### Step 5 — Riepilogo & Attivazione
- Summary card: business name, type, services preview, Google Calendar status, bot link
- QR code preview of the bot link (downloadable as PNG)
- "Attiva RistoAgent →" button → saves to Supabase, redirects to Dashboard

---

## Dashboard

### Header
- Logo + business name
- Active status indicator (green dot)
- Navigation tabs

### Tab: Oggi
- Today's bookings list from Supabase (synced from Google Calendar)
  - Time | Customer name | Party size | Status
- Quick metrics: messages today, bookings today, next available slot

### Tab: Conversazioni
- List of recent conversations with preview of last message
- Click → full conversation history
- Language badge (IT / EN)
- Status: handled by AI

### Tab: Impostazioni
- Edit business info and hours
- Google Calendar connection status + reconnect button
- Telegram bot token (masked) + bot link with copy button
- QR code image (downloadable PNG) for the bot link — with instructions: "Scarica e usa su volantini, social, menu, vetrina"
- Active plan (Starter / Pro)

---

## Tutorials & UX Guidance

Every step in onboarding includes:
- A short explanation of **why** the step is needed (not just what to do)
- Numbered visual instructions for any external action (BotFather, Google)
- A confirmation state when the step is completed successfully
- A "Hai bisogno di aiuto?" link opening a contextual help panel

Dashboard tabs include:
- First-time empty states with guidance ("Nessuna prenotazione ancora — condividi il tuo QR code per iniziare")
- Tooltips on metrics explaining what they measure

---

## AI Behavior (Claude)

**System prompt structure:**
```
You are a virtual assistant for [business name], a [business type] in Italy.

Business info:
- Services: [services]
- Opening hours: [opening_hours]
- Language: respond in the same language the customer uses (Italian or English)

Your job:
- Answer questions about services, prices, and hours
- Manage bookings: collect date, time, party size, and customer name
- Check Google Calendar availability before confirming
- Confirm bookings warmly and professionally
- Never invent information not provided above
```

**Booking flow:**
1. Customer requests a booking
2. Claude collects: date, time, party size, name
3. API route checks Google Calendar availability
4. If available: creates event, confirms to customer
5. If not available: proposes alternatives

---

## Future Feature (Phase 2)

**Embeddable widget (Option B):** A JavaScript snippet the business owner can paste on their website to show a chat widget connected to the same Telegram bot backend.

---

## Out of Scope (v1)

- SMS channel
- Multi-language beyond IT/EN
- Multiple Telegram bots per account
- Payment processing
- Staff management
