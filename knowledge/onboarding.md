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

**Consiglio:** più informazioni dai, migliore sarà la qualità delle risposte del bot

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

Il documento caricato si aggiunge alle informazioni inserite nel Step 2 — non le sostituisce. Puoi usare entrambi: il Step 2 per le informazioni principali (orari, servizi base) e il documento per dettagli estesi (menù completo, listino prezzi dettagliato).
