# Strategia Email Marketing — RistoAgent Cold Outreach
## Aggiornata: 15/04/2026

---

## Analisi lista

| Segmento | Contatti | Approccio |
|---|---|---|
| Tier A (rating >= 4.5) | 64 | Personalizzato, focus Pro plan |
| Tier B (rating 4.0–4.4) | 71 | Standard, focus Starter |
| Tier C (rating < 4.0) | 5 | Esclusi dal primo invio |
| **Totale attivi** | **135** | |

---

## Regole fondamentali (anti-spam + deliverability)

1. **Mai inviare tutto insieme** — max 50 email/giorno, distanziate di 2s
2. **Oggetto senza parole spam**: no "gratis", "offerta", "sconto", "€€€", MAIUSCOLE
3. **Niente allegati** — nessun PDF allegato, link al sito invece
4. **Testo plain text incluso** — ogni email ha sia HTML che testo puro
5. **Unsubscribe in footer** — obbligatorio per CAN-SPAM
6. **Mittente coerente** — sempre "Alex <info@ristoagent.com>"

---

## Timing ottimale

**Giorno:** Martedì, Mercoledì, Giovedì
**Orario:** 9:00–10:30 (prima del servizio pranzo) oppure 14:30–16:00 (pausa pomeridiana)
**Evitare:** Lunedì mattina (sovraccarico), Venerdì pomeriggio, Weekend (in servizio)

**Piano invio:**
- Giorno 1 (martedì): Email 1 → Tier A (64 contatti)
- Giorno 3 (giovedì): Email 1 → Tier B (71 contatti)
- Giorno 5 (sabato, no — lunedì): Follow-up → chi non ha aperto Email 1 Tier A
- Giorno 8 (giovedì): Follow-up → chi non ha aperto Email 1 Tier B
- Giorno 12: Email 3 (last call) → tutti i non-convertiti

---

## Sequenza 3 email

### EMAIL 1 — Primo contatto ("Il problema")

**Obiettivo:** Creare consapevolezza del problema, curiosità sul prodotto
**Oggetto A:** `Ho visto che {{NOME_RISTORANTE}} risponde bene ai clienti`
**Oggetto B:** `Una domanda sul tuo ristorante`
**Oggetto C:** `Come gestite le prenotazioni su Telegram?`

> Usa oggetto B per Tier A (alto rating → tono diretto), oggetto A per Tier B

**Struttura corpo:**
- Riga 1-2: Apertura personale (perché scrivo a LORO)
- Riga 3-4: Il problema (prenotazioni perse, telefonate)
- Riga 5-6: La soluzione in 1 frase
- Riga 7: Offerta Founding Members
- CTA: un solo link → ristoagent.com

---

### EMAIL 2 — Follow-up ("La prova")

**Inviata a:** Chi non ha aperto Email 1 (dopo 4–5 giorni)
**Obiettivo:** Angolo diverso — mostrare semplicità e velocità
**Oggetto:** `10 minuti per avere un assistente Telegram`

**Struttura corpo:**
- Breve recap ("ti ho scritto qualche giorno fa")
- Focus su semplicità: setup in 10 minuti, QR code pronto
- Prova gratuita 15 giorni senza carta
- CTA: stesso link

---

### EMAIL 3 — Last Call ("Scarcity")

**Inviata a:** Chi non ha convertito dopo Email 1+2 (dopo 10–12 giorni)
**Obiettivo:** Urgenza reale — i 20 posti Founding Members si stanno esaurendo
**Oggetto:** `Ultimi posti all'offerta lancio`

**Struttura corpo:**
- Diretta e breve (5 righe max)
- "Rimangono X posti Founding Members a €19/mese"
- "Dopo tornano a €29"
- CTA singola: ristoagent.com

---

## Personalizzazione per Tier

### Tier A (rating >= 4.5)
- Menzionare le recensioni: "con oltre {{RECENSIONI}} recensioni sapete già come si fidelizza un cliente"
- Pushare Piano Pro (€29 Founding, €49 standard)
- Tono: rispettoso, da pari a pari

### Tier B (rating 4.0–4.4)
- Focus sul risparmio di tempo
- Pushare Piano Starter (€19 Founding, €29 standard)
- Tono: amichevole, informale

---

## Metriche da monitorare (via Resend dashboard)

| Metrica | Target accettabile | Target buono |
|---|---|---|
| Open rate | > 20% | > 35% |
| Click rate | > 2% | > 5% |
| Unsubscribe | < 0.5% | < 0.2% |
| Bounce | < 2% | < 1% |

Se open rate < 20% sull'Email 1 → cambiare oggetto prima del follow-up
Se bounce > 2% → pulire la lista dai domini non validi

---

## Cosa NON fare

- Non inviare la stessa email a chi ha già risposto o si è iscritto
- Non usare "Re:" nell'oggetto se non è una vera risposta (trucco abusato, ora bruciato)
- Non mandare più di 3 email totali alla stessa persona
- Non comprare liste aggiuntive (danneggiano la domain reputation)
