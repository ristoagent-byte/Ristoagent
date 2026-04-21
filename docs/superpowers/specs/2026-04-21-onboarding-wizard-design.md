# Onboarding Wizard — Design Spec
**Data:** 2026-04-21  
**Stato:** Approvato, pronto per implementazione

---

## Obiettivo

Sostituire l'onboarding attuale (5 step, free-form) con un wizard guidato a 8 step che:
- Impedisce configurazioni incomplete tramite UX persuasiva (non blocchi tecnici)
- Raccoglie dati strutturati necessari per prenotazioni reali
- Trasforma la percezione del prodotto: da "setup chatbot" a "attivazione sistema operativo"

---

## Architettura

### Principi
- 1 file principale: `app/onboarding/page.tsx` (logica e step inline)
- Step functions sono UI-only, la logica resta nel componente padre
- Nessuna libreria di state management: solo `useState`
- 2 DB writes totali (non di più)

### Stato unico
```ts
const [step, setStep] = useState(1);
const [completedSteps, setCompletedSteps] = useState<number[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");

const [data, setData] = useState({
  // Step 1
  botToken: "",
  botName: "",
  botUsername: "",

  // Step 2
  name: "",
  city: "",
  types: [] as string[],
  partitaIva: "",

  // Step 3
  cuisine: [] as string[],
  allowsDogs: false,
  hasGlutenFree: false,
  extraNotes: "",

  // Step 4
  tables: { t2: 0, t4: 0, t6: 0, terrace: false },

  // Step 5
  hours: {} as Record<string, { lunch?: string; dinner?: string } | null>,

  // Step 6
  calendarConnected: false,

  // Step 7
  rules: { durationMin: 90, delayMin: 15, noticeHours: 1 },
});
```

### API calls (2 totali)

| Quando | Call | Payload |
|--------|------|---------|
| Step 2 completato | `POST /api/business` | token, botUsername, name, city, type, partita_iva |
| Step 8 finale | `PUT /api/business` | tutti i nuovi campi strutturati |

### localStorage — autosave + sopravvivenza OAuth

```ts
// In nextStep():
localStorage.setItem("onboarding_draft", JSON.stringify({ data, step }));

// In useEffect (mount):
const draft = localStorage.getItem("onboarding_draft");
if (draft) {
  const { data: d, step: s } = JSON.parse(draft);
  setData(d);
  setStep(s);
}
```

Il redirect Google OAuth avviene SENZA salvare nel DB prima. Al ritorno (via `?google=connected` nei search params, già gestito dall'API callback attuale), lo stato viene ripristinato da localStorage e `data.calendarConnected` impostato a `true`. Dopo il PUT finale (step 8), `localStorage.removeItem("onboarding_draft")` per pulizia.

---

## 8 Step

### Step 1 — Collega il tuo bot Telegram
**Copy:** "Il bot è il canale attraverso cui i clienti prenoteranno. Crearlo è gratuito e richiede 2 minuti."  
**Validazione:** chiamata diretta a `https://api.telegram.org/bot{token}/getMe` (no backend)  
**Successo:** stato aggiornato con `botName`, `botUsername`; badge "✅ Bot connesso — @username"  
**Momento psicologico:** primo segnale che funziona davvero  
**Non salvare nel DB** — token salvato in state, va nel POST di step 2

### Step 2 — Il tuo ristorante
**Campi:** nome attività, città, tipo (chips multipli), P.IVA  
**DB write:** `POST /api/business` con token + profilo  
**Anti-abuse:** check P.IVA esistente (già implementato)  
**Messaggio conseguenza:** assente (step neutro)

### Step 3 — Cosa deve sapere il bot
**Titolo:** "Queste informazioni determinano la qualità delle risposte ai tuoi clienti"  
**UI guidata:**
- Tipo cucina → chips multiselect (Italiana, Pizza, Pesce, Carne, Vegetariana, Fusion, Altro)
- Animali ammessi → toggle con etichetta
- Senza glutine disponibile → toggle con etichetta
- Note libere → textarea con placeholder guidato: "Parcheggio gratuito in Via Verdi, accettiamo carte, ambiente informale..."

**Serializzazione al PUT (step 8):**
```ts
function buildNotesText(data): string {
  return [
    data.cuisine.length > 0 ? `Cucina: ${data.cuisine.join(', ')}` : null,
    data.allowsDogs ? "Animali ammessi: accettiamo cani" : null,
    data.hasGlutenFree ? "Disponibili opzioni senza glutine" : null,
    data.extraNotes || null,
  ].filter(Boolean).join('\n');
}
```

Questo testo viene salvato nel campo `services` (già letto dall'AI nel system prompt).

### Step 4 — I tuoi tavoli
**Titolo:** "Capacità del ristorante"  
**Messaggio conseguenza:** "Senza il numero di tavoli, il bot non sa quando il ristorante è pieno"  
**Campi:**
- Tavoli da 2 persone (spinner numerico, min 0)
- Tavoli da 4 persone (spinner numerico, min 0)
- Tavoli da 6+ persone (spinner numerico, min 0)
- Terrazza/esterno → toggle
**Totale coperti** mostrato live (calcolato: t2×2 + t4×4 + t6×6)

### Step 5 — Orari di apertura
**Titolo:** "Quando sei aperto"  
**Messaggio conseguenza:** "Senza gli orari, il bot accetta prenotazioni anche quando sei chiuso"  
**UI:** griglia settimanale (Lun–Dom), per ogni giorno:
- Toggle "chiuso"
- Se aperto: input pranzo (da–a) e/o cena (da–a)

**Formato stato:**
```ts
hours: {
  mon: { lunch: "12:00-14:30", dinner: "19:00-22:30" },
  tue: null, // chiuso
  wed: { dinner: "19:00-23:00" },
  ...
}
```

**Serializzazione al PUT:**
```ts
function serializeHoursToText(hours): string {
  const giorni = { mon: "Lun", tue: "Mar", wed: "Mer", thu: "Gio", fri: "Ven", sat: "Sab", sun: "Dom" };
  return Object.entries(giorni).map(([k, label]) => {
    const h = hours[k];
    if (!h) return `${label}: chiuso`;
    const slots = [h.lunch && `pranzo ${h.lunch}`, h.dinner && `cena ${h.dinner}`].filter(Boolean);
    return `${label}: ${slots.join(', ')}`;
  }).join('\n');
}
```

Salvato sia in `opening_hours` (text, per l'AI) sia in `opening_hours_structured` (JSONB).

### Step 6 — Attiva il sistema di prenotazioni automatiche
**Titolo:** "Attiva il sistema di prenotazioni automatiche"  
**Sub:** "Ogni prenotazione viene salvata automaticamente nel tuo calendario"  
**Micro:** "Senza questo passaggio, il bot non può confermare prenotazioni"  
**Flusso OAuth:** identico all'attuale (redirect a `/api/google/auth`)  
**Prima del redirect:** `localStorage.setItem(...)` con stato completo  
**Post-connessione:** 
- Badge "✅ Sistema attivo"
- Mini simulazione statica:
  ```
  Cliente: "Prenota per 2 domani alle 20"
  → ✔ Salvato nel tuo calendario
  ```
**Momento psicologico:** "vale soldi" — il sistema salva prenotazioni reali

### Step 7 — Regole di prenotazione
**Titolo:** "Come gestisci le prenotazioni"  
**Messaggio conseguenza:** "Queste regole evitano prenotazioni impossibili o doppie"  
**Campi:**
- Durata media prenotazione → slider o input (default 90 min)
- Tolleranza ritardo → select (0/10/15/20/30 min, default 15)
- Preavviso minimo → select (30min/1h/2h/24h, default 1h)

### Step 8 — Il tuo sistema è pronto
**Titolo:** "Il tuo sistema è pronto"  
**DB write:** `PUT /api/business` con tutti i dati accumulati  
**UI:** simulazione prenotazione animata (identica alla landing page demo)  
**Frase chiave (obbligatoria):** "Questo è esattamente ciò che succede quando un cliente ti scrive su Telegram"  
**QR Code:** generato via `/api/qrcode`, scaricabile  
**CTA finale:** "Vai alla Dashboard →"  
**Momento psicologico:** "lo voglio" — vedere il sistema funzionante

---

## Schema DB — SQL Migration

Da eseguire manualmente su Supabase SQL Editor:

```sql
ALTER TABLE businesses 
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS tables_2 INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tables_4 INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tables_6 INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS has_terrace BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reservation_duration_min INTEGER DEFAULT 90,
  ADD COLUMN IF NOT EXISTS max_delay_min INTEGER DEFAULT 15,
  ADD COLUMN IF NOT EXISTS min_notice_hours INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS opening_hours_structured JSONB;
```

Tutti i campi hanno default → backward compatibility garantita. Il bot esistente non si rompe.

---

## File da modificare

| File | Tipo modifica |
|------|--------------|
| `app/onboarding/page.tsx` | Riscrittura completa |
| `types/index.ts` | Aggiunta 9 campi opzionali a `Business` |
| `app/api/business/route.ts` | POST e PUT accettano nuovi campi |
| `lib/claude.ts` | System prompt + durata default da business config |

### `types/index.ts` — campi da aggiungere a Business
```ts
city?: string;
tables_2?: number;
tables_4?: number;
tables_6?: number;
has_terrace?: boolean;
reservation_duration_min?: number;
max_delay_min?: number;
min_notice_hours?: number;
opening_hours_structured?: Record<string, { lunch?: string; dinner?: string } | null>;
```

### `lib/claude.ts` — aggiornamenti system prompt
```ts
const capacityInfo = (business.tables_2 || business.tables_4 || business.tables_6)
  ? `\nCapacità: ${business.tables_2 ?? 0} tavoli da 2, ${business.tables_4 ?? 0} tavoli da 4, ${business.tables_6 ?? 0} tavoli da 6+${business.has_terrace ? ' + terrazza' : ''}`
  : "";

const rulesInfo = business.reservation_duration_min
  ? `\nRegole prenotazioni: durata media ${business.reservation_duration_min} min, tolleranza ritardo ${business.max_delay_min ?? 15} min, preavviso minimo ${business.min_notice_hours ?? 1}h`
  : "";
```

La durata default nel tool `create_booking` passa da `?? 60` a `?? (business.reservation_duration_min ?? 90)`.

---

## Cosa NON è in scope

- Completeness score dashboard (Fase 2 — quando ci sono dati reali)
- Preview live bot con Claude API in step 3 (Fase 2)
- Test reale bot in step 8 con webhook detection (Fase 2)
- `/api/business/draft` endpoint (localStorage è sufficiente)

---

## Backward Compatibility

- Utenti con onboarding già completato → redirect a dashboard (invariato)
- Bot esistenti → continuano a funzionare (tutti i nuovi campi sono opzionali con default)
- AI system prompt → legge `services` e `opening_hours` come prima; i nuovi campi sono addizioni
