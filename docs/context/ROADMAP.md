# RistoAgent — Roadmap sviluppi futuri

## Feature in ordine di priorità

### 1. Widget sito web (priorità alta)
Chat embeddable via `<script>` nel sito del ristorante.
```html
<script src="https://ristoagent.com/widget.js" data-business="BUSINESS_ID"></script>
```
- Bottone "Prenota" + chat widget flottante alimentato dallo stesso AI del bot Telegram
- Stesso backend, stesso calendario Google, zero config aggiuntiva
- **Solo piano Pro** — differenziatore chiave rispetto a Starter
- Endpoint da creare: `/api/widget/chat` (equivalente a `/api/telegram/webhook` senza auth Telegram)

### 2. Promozioni automatiche
Il bot invia offerte e messaggi promozionali ai clienti Telegram che hanno già interagito.
- Invio manuale dal dashboard o schedulato
- Template personalizzabili per ogni ristorante

### 3. Buoni sconto
Generazione e validazione coupon tramite bot Telegram.
- Codice univoco generato dal dashboard
- Validazione via bot al momento dell'uso

### 4. Ordinazioni
Gestione ordini da asporto/consegna via Telegram.
- Flusso: cliente ordina → bot conferma → dashboard notifica

### 5. Analisi fatturato
Dashboard con trend prenotazioni, revenue stimato, coperti per giorno/ora.

### 6. Magazzino
Gestione scorte collegata alle prenotazioni (ingredienti, coperti max).

### 7. Marketing AI
Suggerimenti automatici su quando e come fare promozioni basati sui dati di prenotazione.

### 8. Sondaggi clienti finali
Post-visita, il bot invia un sondaggio breve. I dati aggregati servono per analisi di mercato e per migliorare il servizio offerto da RistoAgent.

### 9. Pagina /roadmap pubblica
Roadmap visibile sul sito per comunicare trasparenza e raccogliere interesse su feature future.

---

## Note architetturali

- Il widget usa `business_id` come parametro pubblico — non espone credenziali
- Tutte le feature di AI usano lo stesso sistema di contesto del bot Telegram
- I piani Base/Starter restano Telegram-only; Pro aggiunge widget + feature avanzate

---

## Fattori di rischio a scala

### Limiti Gemini free tier (Google AI Studio)
Attualmente il bot Telegram e la chat di supporto usano **Gemini 2.0 Flash** nel piano gratuito.

Limiti free tier:
- 1.500 richieste/giorno
- 15 richieste/minuto
- 1.000.000 token/minuto

**Soglia critica stimata**: il free tier regge fino a ~50-70 ristoranti attivi con traffico normale. Superata questa soglia, o in caso di picchi simultanei (sabato sera, festività), si rischia il rate limit con conseguente blocco delle prenotazioni.

**Azioni da pianificare al raggiungimento di ~30 clienti attivi**:
1. Monitorare il consumo giornaliero su [Google AI Studio](https://aistudio.google.com)
2. Valutare il passaggio a **Gemini pay-as-you-go** (molto più economico di Anthropic: ~$0.10/1M token input vs $3/1M di Claude Sonnet)
3. Implementare una coda di messaggi per smorzare i picchi (es. Vercel Queues o job Supabase)
4. Considerare un **fallback su Groq** (Llama 3.3 70B, 14.400 req/giorno gratuiti) per i messaggi semplici, riservando Gemini alle conversazioni con tool use (prenotazioni)
