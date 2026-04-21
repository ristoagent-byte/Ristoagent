# RistoAgent — Regole di comunicazione con Claude

## Shortcut e convenzioni

### "g" = leggi lo screenshot più recente
Quando l'utente scrive "g" (da solo o con testo aggiuntivo), Claude legge automaticamente lo screenshot più recente senza chiedere conferma.

**Come trovarlo:**
```bash
# 1. Trova la cartella mese più recente
ls -t C:/Users/Admin/Pictures/Screenshots/

# 2. Trova il file più recente nella cartella
ls -t "C:/Users/Admin/Pictures/Screenshots/2026-04/" | head -1

# 3. Leggi con Read tool
```

**Struttura screenshot:**
```
C:\Users\Admin\Pictures\Screenshots\
  2024-09\    ← settembre 2024
  2026-03\    ← marzo 2026
  2026-04\    ← aprile 2026 (429 file)
```
Gli screenshot sono organizzati in sottocartelle `YYYY-MM`. Per trovare il più recente, controlla prima quale sottocartella è la più recente.

---

## Stile di risposta

- **Breve e diretto** — niente preamboli, niente riassunti finali inutili
- **No emoji** salvo richiesta esplicita
- **Italiano** sempre (salvo codice)
- **Conferma prima di azioni distruttive** (eliminare file, push forzati, ecc.)

---

## Preferenze operative

- **Parallelismo**: eseguire sempre tool call indipendenti in parallelo, mai sequenzialmente senza necessità
- **Costi**: priorità ai free tier; segnalare proattivamente avvicinamento ai limiti
- **Commit**: creare commit solo quando richiesto esplicitamente
- **Deploy**: sempre `vercel --prod` per mandare in produzione; chiedere conferma prima

---

## Account e accessi importanti

| Account | Ruolo |
|---|---|
| ristoagent@gmail.com | Account principale utente (admin RistoAgent) |
| albe.berna@gmail.com | Fratello dell'utente — NON cancellare mai |
| info@ristoagent.com | Email pubblica del progetto |
| privacy@ristoagent.com | Email GDPR |

---

## Contesto utente

L'utente è il fondatore di RistoAgent. Ha buona visione di prodotto, preferisce essere guidato passo passo sulle operazioni manuali (es. Supabase, Stripe dashboard). Per le decisioni tecniche si fida del giudizio di Claude ma vuole essere informato delle scelte importanti.
