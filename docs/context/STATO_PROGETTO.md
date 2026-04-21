# RistoAgent — Stato del progetto (aprile 2026)

## Panoramica

RistoAgent è un SaaS italiano che fornisce bot Telegram basati su AI per ristoranti.
Il bot gestisce prenotazioni, cancellazioni e comunicazioni con i clienti, sincronizzando con Google Calendar.

**Fondatore**: Alessandro Bernabé  
**Entità legale**: OSVČ, IČO 06043194, Praha, Repubblica Ceca  
**Sito**: ristoagent.com  

---

## Stack tecnico

| Layer | Tecnologia |
|---|---|
| Frontend | Next.js 16 App Router, TypeScript, CSS inline |
| Backend | Next.js API Routes (serverless) |
| Database | Supabase (PostgreSQL) + Auth |
| AI | Anthropic Claude (claude-haiku per bot, sonnet per support) |
| Pagamenti | Stripe (Checkout + Portal + Webhook) |
| Email | Resend (transazionale + marketing) |
| Bot | Telegram Bot API (webhook) |
| Hosting | Vercel (produzione) |
| DNS | Cloudflare |
| Calendario | Google Calendar API (OAuth2) |

---

## Funzionalità live

### Sito pubblico
- Landing page: hero, feature, QR code (con callout onboarding), pricing, roadmap, FAQ
- Pagine legali: /terms (con DPA GDPR Allegato A), /privacy, /legal
- /roadmap: roadmap pubblica feature future

### Onboarding (8 step)
1. Nome ristorante + tipo cucina
2. Indirizzo + contatti
3. Orari di apertura
4. Menu (piatti, prezzi, allergeni)
5. Regole prenotazione (coperti, durata, anticipo)
6. Setup bot Telegram (token)
7. Google Calendar (OAuth opzionale)
8. QR code generato e scaricabile

### Dashboard utente
- Lista prenotazioni del giorno/settimana
- Conversazioni Telegram
- Impostazioni ristorante
- Upgrade piano / gestione abbonamento Stripe

### Dashboard admin (ristoagent@gmail.com)
- Statistiche globali (utenti, prenotazioni, revenue)
- Lista utenti con dati ristorante
- Eliminazione utente con cascade (feedbacks → messages → bookings → conversations → businesses → auth)
- Stats campagna email marketing

### Bot Telegram
- Risposta AI a messaggi testuali e vocali
- Flusso prenotazione guidato
- Cancellazione prenotazioni
- FAQ automatiche
- Notifiche al ristoratore

### Email transazionali (Supabase)
- Confirm signup — con logo
- Magic link — con logo
- Reset password — con logo

### Branding
- Logo: piatto bianco con bordo rosso + scritta RISTOAGENT (file: public/logo.png, 2000×2000 RGBA)
- Favicon: public/icon.png (512×512, ritagliato dal logo)
- Apple touch icon: public/apple-icon.png (180×180)
- OG image: https://www.ristoagent.com/icon.png

---

## Campagna email marketing (in corso)

### Milano (lista manuale)
- Pool: 140 contatti
- Step 1 completato: ~69 email
- Step 2 e 3: da completare secondo schedule

### OSM (dati OpenStreetMap)
- Pool: ~1.314 ristoranti in 6 città (Bologna, Firenze, Milano, Napoli, Roma, Torino)
- Invii in batch da 16/città/giorno (limite Resend free: 100/giorno)
- Log: marketing/invii_osm_log.json
- Schedule: lib/campaign-schedule.ts

---

## Struttura file chiave

```
app/
  page.tsx              ← landing page
  onboarding/page.tsx   ← wizard onboarding
  dashboard/page.tsx    ← dashboard utente
  admin/page.tsx        ← dashboard admin
  terms/page.tsx        ← termini + DPA
  privacy/page.tsx      ← privacy policy
  api/
    business/           ← CRUD dati ristorante
    telegram/webhook    ← bot AI
    stripe/             ← pagamenti
    admin/              ← stats + delete-user
    qrcode/             ← generazione QR
    google/             ← OAuth Calendar

lib/
  campaign-schedule.ts  ← schedule invii email
  email-marketing.ts    ← stats campagna

marketing/
  supabase_email_templates/  ← confirm, magic link, reset pw
  email_template.html        ← step 1 cold outreach
  email_followup.html        ← step 2
  email_lastcall.html        ← step 3
  invii_log.json             ← log Milano
  invii_osm_log.json         ← log OSM

public/
  logo.png    ← logo principale (2000×2000 RGBA)
  icon.png    ← favicon (512×512)
  apple-icon.png  ← (180×180)
```

---

## Limiti free tier da monitorare

| Servizio | Limite | Quando controllare |
|---|---|---|
| Resend | 3.000 email/mese, 100/giorno | Ogni batch email |
| Supabase | 500 MB DB, 50.000 auth users | Mensile |
| Vercel | 100 GB bandwidth | Mensile |
| Stripe | Nessun limite (% su transazioni) | — |
