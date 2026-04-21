# RistoAgent — Contesto di sessione Claude

> Questo file viene caricato automaticamente ad ogni sessione. Contiene le regole di comunicazione, lo stato del progetto e i riferimenti essenziali.

---

## Regole di comunicazione

### Shortcut "g"
Quando l'utente scrive solo **"g"** (anche con testo aggiuntivo tipo "g cosa devo fare"), leggere automaticamente lo screenshot più recente:
```
C:\Users\Admin\Pictures\Screenshots\YYYY-MM\
```
Gli screenshot sono organizzati in sottocartelle per anno-mese. Per trovare il più recente:
1. `ls -t C:/Users/Admin/Pictures/Screenshots/` → trova la cartella più recente (es. `2026-04`)
2. `ls -t C:/Users/Admin/Pictures/Screenshots/2026-04/ | head -1` → trova il file più recente
3. Leggilo con il tool Read

### Stile risposte
- Risposte brevi e dirette
- No emoji salvo richiesta esplicita
- Operazioni indipendenti sempre in parallelo
- Priorità ai free tier e alla minimizzazione dei costi

---

## Progetto: RistoAgent

**Cos'è**: SaaS italiano — bot Telegram AI per prenotazioni ristoranti, con Google Calendar, dashboard web, QR code.

**Prodotto da**: Alessandro Bernabé (OSVČ, IČO 06043194, Praha, CZ)

**Stack**: Next.js 16 App Router · TypeScript · Supabase · Stripe · Resend · Vercel · Telegram Bot API · Anthropic Claude

**Dominio**: ristoagent.com (Cloudflare DNS, Vercel hosting)

**Email operativa**: ristoagent@gmail.com · info@ristoagent.com

---

## Stato attuale (aprile 2026)

### Funzionalità live
- Landing page con sezioni: hero, feature, QR code, pricing, roadmap, FAQ
- Onboarding wizard 8 step (dati ristorante, menu, orari, bot Telegram, Google Calendar, QR code)
- Dashboard utente: prenotazioni, conversazioni, impostazioni
- Dashboard admin (ristoagent@gmail.com): stats, lista utenti, eliminazione con cascade
- Bot Telegram AI: prenotazioni, cancellazioni, messaggi vocali, FAQ
- Pagamenti Stripe (Starter €29/mo, Pro €49/mo, Flessibile €39/mese)
- Prova gratuita 15 giorni senza carta
- Email transazionali Supabase (confirm signup, magic link, reset password) — con logo
- Termini di servizio + Privacy Policy + DPA GDPR (Allegato A)
- Favicon + OG image dal logo del piatto rosso

### Piani pricing
- **Starter** €29/mese: 300 operazioni, rinnovo automatico
- **Pro** €49/mese: operazioni illimitate, rinnovo automatico
- **Flessibile** €39/mese: 500 operazioni, no rinnovo automatico

### Campagna email in corso
- 140 contatti Milano (sequenza 3 step)
- ~1.400 contatti OSM (Bologna, Firenze, Milano, Napoli, Roma, Torino) — sequenza 1 step
- Invii via Resend, log in `marketing/invii_log.json` e `marketing/invii_osm_log.json`
- Schedule in `lib/campaign-schedule.ts`

---

## Sviluppi futuri pianificati

Vedi dettagli completi in `docs/context/ROADMAP.md`

1. **Widget sito web** — `<script src="ristoagent.com/widget.js">` chat embeddable, solo piano Pro
2. **Promozioni automatiche** — bot invia offerte ai clienti Telegram
3. **Buoni sconto** — generazione e validazione coupon
4. **Ordinazioni** — gestione ordini via Telegram
5. **Analisi fatturato** — dashboard con trend prenotazioni/revenue
6. **Magazzino** — gestione scorte collegata alle prenotazioni
7. **Marketing AI** — suggerimenti automatici su promozioni
8. **Sondaggi clienti** — raccolta feedback post-visita per analisi di mercato
9. **Pagina /roadmap** — roadmap pubblica sul sito

---

## Percorsi importanti

| Risorsa | Percorso |
|---|---|
| Progetto | `C:\Users\Admin\OneDrive\RISTOAGENT\` |
| Screenshot | `C:\Users\Admin\Pictures\Screenshots\YYYY-MM\` |
| Logo | `public/logo.png` · `public/icon.png` |
| Email templates Supabase | `marketing/supabase_email_templates/` |
| Email templates marketing | `marketing/email_template.html` · `email_followup.html` · `email_lastcall.html` |
| Automazioni | `docs/AUTOMATIONS.md` |
| Memoria persistente | `C:\Users\Admin\.claude\projects\C--Users-Admin-OneDrive-RISTOAGENT\memory\` |
| Context esteso | `docs/context/` |

---

## Dashboard esterne

| Servizio | URL |
|---|---|
| Vercel | vercel.com/ristoagent-4347s-projects/ristoagent |
| Supabase | supabase.com/dashboard |
| Resend | resend.com/dashboard |
| Stripe | dashboard.stripe.com |
| Cloudflare | cloudflare.com |

---

## Team / account

- **ristoagent@gmail.com** — account principale utente
- **albe.berna@gmail.com** — fratello dell'utente, NON eliminare da Supabase
