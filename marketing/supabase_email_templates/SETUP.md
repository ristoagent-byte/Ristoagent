# Configurazione email auth Supabase — RistoAgent

Oggi le email di signup arrivano da "Supabase Auth <noreply@mail.app.supabase.io>" e sono in inglese. Dopo questa configurazione arriveranno da **RistoAgent <noreply@ristoagent.com>** in italiano, col brand del sito.

## 1. Custom SMTP via Resend (per avere "RistoAgent" come mittente)

Resend è già attivo per le cold email (la `RESEND_API_KEY` sta in `.env.local`). Lo riusiamo per le email transazionali di Supabase.

Vai su https://supabase.com/dashboard/project/_/settings/auth → sezione **SMTP Settings** → toggle **Enable Custom SMTP**.

Inserisci:

| Campo | Valore |
|---|---|
| Sender email | `noreply@ristoagent.com` |
| Sender name | `RistoAgent` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | *la tua `RESEND_API_KEY`* (inizia con `re_...`) |
| Minimum interval | `60` secondi |

Salva. Da ora ogni email di Supabase esce via Resend col mittente `RistoAgent <noreply@ristoagent.com>`.

> **Prerequisito:** il dominio `ristoagent.com` deve essere verificato in Resend (SPF/DKIM/DMARC in Cloudflare). Lo è già visto che mandiamo le cold email.

## 2. Template email personalizzati

Nella stessa pagina auth, scorri fino a **Email Templates**. Ci sono 4 template. Per ognuno sostituisci Subject + HTML con quelli qui sotto.

### a) Confirm signup

- **Subject:** `Conferma la tua email — RistoAgent`
- **Message body (HTML):** copia il contenuto di `confirm_signup.html`

### b) Magic Link

- **Subject:** `Il tuo link di accesso a RistoAgent`
- **Message body (HTML):** copia il contenuto di `magic_link.html`

### c) Reset Password

- **Subject:** `Reimposta la password — RistoAgent`
- **Message body (HTML):** copia il contenuto di `reset_password.html`

### d) Change Email Address

Puoi lasciare il default per ora (è un flusso raro).

## 3. Verifica

Dopo aver salvato:

1. Vai su https://ristoagent.com/auth
2. Clicca "Registrati" e usa un'email di test (es. una tua Gmail)
3. Controlla la casella: deve arrivare da **RistoAgent**, con il bottone azzurro "Conferma la tua email"

Se arriva ancora in inglese o da "Supabase Auth", è rimasto il template default → controlla di aver salvato tutti e 3 i template.
