# Istruzioni Invio Cold Email — RistoAgent

## Stato preparazione (aggiornato 15/04/2026)

| Operazione | Stato |
|---|---|
| CSV filtrato (140 contatti con email) | ✅ `contatti_email.csv` |
| Template email HTML | ✅ `email_template.html` |
| Script invio Python | ✅ `invia_email.py` |
| Dominio ristoagent.com registrato su Resend | ✅ fatto |
| Record DNS aggiunti su Cloudflare | ⏳ da fare (5 minuti) |
| Email di test inviata e verificata | ⏳ da fare |
| Invio campagna completa | ⏳ da fare |

---

## STEP 1 — Aggiungi record DNS su Cloudflare (5 minuti)

Vai su **Cloudflare → ristoagent.com → DNS → Add record**

Aggiungi questi 3 record:

### Record 1 — DKIM (autenticazione mittente)
```
Type:  TXT
Name:  resend._domainkey
Value: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCwi77CG/7jhClCuz1qWOSNhoeRp+7P++q58u0YdkH4TOKI1b5jc1tco6tWH3EIeUvercw2JmrtrgAuqxY2yCMdKm3T7FjsvoCooJ+ZgCu9CJP6Exqn3EGmUyO7mXr43Q+mD2makUd2tL2/06RsnYLRervs2GQy6Hy1IJAwo4f2swIDAQAB
TTL:   Auto
Proxy: NO (DNS only)
```

### Record 2 — MX (gestione feedback/bounce)
```
Type:     MX
Name:     send
Value:    feedback-smtp.eu-west-1.amazonses.com
Priority: 10
TTL:      Auto
Proxy:    NO (DNS only)
```

### Record 3 — SPF (anti-spam)
```
Type:  TXT
Name:  send
Value: v=spf1 include:amazonses.com ~all
TTL:   Auto
Proxy: NO (DNS only)
```

> ⚠️ Assicurati che il proxy Cloudflare sia **OFF** (nuvola grigia) per questi record.

---

## STEP 2 — Verifica il dominio su Resend

Dopo aver aggiunto i record DNS, aspetta 5-10 minuti poi vai su:
**https://resend.com/domains**

Il dominio `ristoagent.com` deve diventare verde (Verified).

---

## STEP 3 — Installa dipendenze Python

```bash
pip install resend
```

---

## STEP 4 — Test email (prima di inviare tutto)

```bash
cd marketing
python invia_email.py --test
```

Questo invia UNA email di test a `ristoagent@gmail.com`.
Controlla che arrivi correttamente, che il layout sia ok, che i link funzionino.

---

## STEP 5 — Invio campagna (140 email)

```bash
python invia_email.py --send
```

Lo script:
- Chiede conferma prima di inviare
- Invia max 100 email per sessione (limite sicurezza)
- Salva un log in `invii_log.json`
- Se si interrompe, riprende dall'ultimo punto con `--start N`

Per le restanti 40 email il giorno dopo:
```bash
python invia_email.py --send --start 100
```

---

## Note importanti

- **Oggetto email:** "Ho trovato il tuo ristorante su Google Maps 🍽️"
- **Mittente:** Alex <info@ristoagent.com>
- **Offerta:** Founding Members €19/€29 (piano Starter/Pro)
- **CTA:** https://ristoagent.com
- **Unsubscribe:** link in footer (CAN-SPAM compliant)
- **Piano Resend free:** 3.000 email/mese — sufficiente per 140 contatti
