# RistoAgent — Automazioni e monitoraggio

> **Principio guida**: ogni operazione ripetibile deve girare senza intervento umano.
> Se ti ritrovi a fare la stessa cosa manualmente due volte, automatizzo.

---

## Automazioni attive

| # | Operazione | Trigger | Frequenza | Strumento |
|---|---|---|---|---|
| 1 | Deploy sito in produzione | `git push` su master | Ogni modifica | Vercel CI/CD |
| 2 | Aggiornamento dashboard admin (email stats) | Fine invio email → autopush | Ogni batch email | `git_autopush.py` |
| 3 | Health check mattutino | Cron 8:57 in sessione Claude | Ogni giorno | Claude Cron |

---

## Operazioni manuali pianificate

| Data | Operazione | Comando |
|---|---|---|
| 21/04/2026 | Milano Tier B Step1 + OSM batch | vedi campaign-schedule.ts |
| 22/04/2026 | OSM Batch 2 | `python invia_osm.py --citta tutte --limit 16 --yes` |
| 23/04/2026 | Milano Tier A Step2 + OSM | vedi campaign-schedule.ts |
| 28/04/2026 | Milano Tier B Step2 + OSM | vedi campaign-schedule.ts |
| 29/04/2026 | OSM Batch 3 | `python invia_osm.py --citta tutte --limit 16 --yes` |
| 30/04/2026 | Milano Step3 parte 1 + OSM | vedi campaign-schedule.ts |
| 05/05/2026 | Milano Step3 parte 2 + OSM | vedi campaign-schedule.ts |
| 06-07/05/2026 | OSM Batch 4+5 | `python invia_osm.py --citta tutte --limit 16 --yes` |

---

## Checklist salute sistema (giornaliera automatica)

Il health check delle 8:57 controlla:

- [ ] Build TypeScript senza errori
- [ ] Sito ristoagent.com risponde HTTP 200
- [ ] Nessun invio email in ritardo (done:false con data passata)
- [ ] Log email senza errori anomali
- [ ] File modificati importanti non committati

---

## Aree a rischio — da monitorare manualmente 1×/mese

| Area | Dove controllare | Soglia di allarme |
|---|---|---|
| Quota email Resend | resend.com/dashboard | > 2.500/3.000 mensili |
| Rinnovo dominio | Cloudflare → Domains | < 30 giorni alla scadenza |
| Piano Supabase | supabase.com → Settings | Uso DB > 400 MB (free limit 500) |
| Piano Vercel | vercel.com → Usage | Bandwidth > 80 GB (free limit 100) |
| Abbonamenti Stripe attivi | dashboard.stripe.com | Churn improvviso |

---

## Da automatizzare (backlog)

- [ ] **Aggiornamento `done: true`** in campaign-schedule.ts dopo ogni invio (ora manuale)
- [ ] **HTTP uptime monitor** esterno (es. UptimeRobot free) — ping ogni 5 min, alert email se down
- [ ] **Report settimanale** MRR + nuovi utenti → email a ristoagent@gmail.com ogni lunedì
- [ ] **Pulizia utenti trial scaduti** → query Supabase automatica dopo 15+7 giorni
- [ ] **Backup CSV contatti** su Google Drive dopo ogni campagna

---

## Contatti di emergenza

| Servizio | URL dashboard | Note |
|---|---|---|
| Vercel | vercel.com/ristoagent-byte | Deploy, logs, env vars |
| Supabase | supabase.com/dashboard | DB, auth, SQL editor |
| Resend | resend.com/dashboard | Email logs, quota, SMTP |
| Cloudflare | cloudflare.com | DNS, SSL, dominio |
| Stripe | dashboard.stripe.com | Pagamenti, abbonamenti |
