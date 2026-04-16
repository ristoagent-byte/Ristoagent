export const metadata = {
  title: "Roadmap — RistoAgent",
  description: "Le funzionalità in sviluppo per trasformare RistoAgent nella piattaforma gestionale completa per ristoratori.",
};

const features = [
  {
    icon: "🎙️",
    status: "live",
    statusLabel: "Disponibile ora",
    title: "Messaggi vocali",
    description: "I tuoi clienti possono mandare un vocale su Telegram e l'agente AI capisce, elabora e risponde — esattamente come farebbe un cameriere al telefono. Zero digitare, massima naturalezza.",
    details: [
      "Trascrizione automatica con Groq Whisper",
      "Risposta contestuale dell'agente AI",
      "Funziona con qualsiasi lingua",
    ],
  },
  {
    icon: "🌐",
    status: "next",
    statusLabel: "Prossimamente",
    title: "Widget web",
    description: "Un pulsante chat da aggiungere al sito del ristorante con un semplice copia-incolla. I clienti prenotano direttamente dal browser, senza Telegram e senza scaricare nessuna app.",
    details: [
      "Snippet HTML pronto in dashboard",
      "Chat AI identica al bot Telegram",
      "Nessun costo aggiuntivo",
    ],
  },
  {
    icon: "🎯",
    status: "next",
    statusLabel: "Prossimamente",
    title: "Promozioni mirate",
    description: "Invia offerte personalizzate ai clienti che hai già servito: sconti nel giorno del compleanno, happy hour del mercoledì, promozioni last-minute per i tavoli vuoti del weekend.",
    details: [
      "Segmentazione automatica dei clienti",
      "Invio programmato via Telegram",
      "Tracciamento delle conversioni",
    ],
  },
  {
    icon: "🎟️",
    status: "next",
    statusLabel: "Prossimamente",
    title: "Buoni sconto digitali",
    description: "Crea coupon digitali e distribuiscili via Telegram. Il cliente mostra il codice alla cassa, tu lo validi con un click e monitoni i riscatti in tempo reale dalla dashboard.",
    details: [
      "Generazione QR code del coupon",
      "Validazione alla cassa via app",
      "Report riscatti e conversioni",
    ],
  },
  {
    icon: "🛒",
    status: "planned",
    statusLabel: "In sviluppo",
    title: "Ordinazioni dirette",
    description: "Il cliente sfoglia il tuo menù digitale su Telegram, sceglie i piatti e invia l'ordine direttamente in cucina. Addio telefonate confuse, addio errori di trascrizione.",
    details: [
      "Menù digitale configurabile",
      "Ordini inviati in cucina in tempo reale",
      "Integrazione con sistemi POS",
    ],
  },
  {
    icon: "📊",
    status: "planned",
    statusLabel: "In sviluppo",
    title: "Analisi fatturato",
    description: "Una dashboard che trasforma i tuoi dati in decisioni: andamento vendite, piatti più ordinati, fasce orarie più redditizie, confronto settimana su settimana e mese su mese.",
    details: [
      "Grafici interattivi in tempo reale",
      "Piatti top e trend stagionali",
      "Export dati in Excel/CSV",
    ],
  },
  {
    icon: "📦",
    status: "planned",
    statusLabel: "In sviluppo",
    title: "Gestione magazzino",
    description: "Collega le ordinazioni alle scorte. L'agente ti avvisa automaticamente quando un ingrediente sta per finire e ti suggerisce gli ordini ai fornitori prima che sia troppo tardi.",
    details: [
      "Alert ingredienti in esaurimento",
      "Collegamento automatico con gli ordini",
      "Storico consumi per stagione",
    ],
  },
  {
    icon: "🧠",
    status: "future",
    statusLabel: "Visione futura",
    title: "Strategia di marketing AI",
    description: "L'agente analizza i tuoi dati reali — clienti, prenotazioni, fasce orarie, piatti — e genera un piano d'azione concreto: chi recuperare, quando promuovere, cosa comunicare.",
    details: [
      "Piano settimanale generato dall'AI",
      "Suggerimenti basati su dati reali",
      "A/B test automatici sui messaggi",
    ],
  },
  {
    icon: "📈",
    status: "future",
    statusLabel: "Visione futura",
    title: "Analisi di mercato",
    description: "Dati aggregati e anonimi su clienti, preferenze e abitudini nel tuo quartiere. Capisci il mercato locale prima dei tuoi competitor e adatta la tua offerta di conseguenza.",
    details: [
      "Heatmap clienti per zona",
      "Confronto con benchmark di categoria",
      "Tendenze stagionali del mercato locale",
    ],
  },
];

const statusConfig: Record<string, { color: string; bg: string; border: string }> = {
  live:    { color: "#f97316", bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.3)" },
  next:    { color: "#0ea5e9", bg: "rgba(14,165,233,0.1)", border: "rgba(14,165,233,0.2)" },
  planned: { color: "#22c55e", bg: "rgba(34,197,94,0.1)",  border: "rgba(34,197,94,0.2)"  },
  future:  { color: "#94a3b8", bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.15)" },
};

export default function RoadmapPage() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font)" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0f1117 0%, #1a1a2e 100%)", padding: "4rem 1.5rem 3rem", textAlign: "center" }}>
        <a href="/" style={{ display: "inline-block", marginBottom: "2rem" }}>
          <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.5px" }}>
            Risto<span style={{ color: "#f97316" }}>Agent</span>
          </span>
        </a>
        <p style={{ color: "#f97316", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.8rem" }}>
          Roadmap pubblica
        </p>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 800, color: "#fff", margin: "0 0 1rem", lineHeight: 1.15 }}>
          Oggi gestisce i clienti.<br />Domani gestisce il tuo business.
        </h1>
        <p style={{ color: "#94a3b8", fontSize: "1.05rem", maxWidth: 560, margin: "0 auto 2rem" }}>
          Questa è la nostra visione: trasformare RistoAgent da agente per le prenotazioni a piattaforma gestionale completa per ogni ristoratore.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          {[
            { status: "live",    label: "Disponibile ora" },
            { status: "next",    label: "Prossimamente" },
            { status: "planned", label: "In sviluppo" },
            { status: "future",  label: "Visione futura" },
          ].map(({ status, label }) => {
            const cfg = statusConfig[status];
            return (
              <span key={status} style={{
                fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
                color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
                padding: "0.3rem 0.8rem", borderRadius: 999,
              }}>{label}</span>
            );
          })}
        </div>
      </div>

      {/* Features grid */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "3rem 1.5rem 5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.4rem" }}>
          {features.map((f) => {
            const cfg = statusConfig[f.status];
            return (
              <div key={f.title} style={{
                background: "var(--surface)", border: `1px solid ${cfg.border}`,
                borderRadius: "1.1rem", padding: "1.8rem",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "1.6rem" }}>{f.icon}</span>
                  <span style={{
                    fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
                    color: cfg.color, background: cfg.bg, padding: "0.2rem 0.65rem", borderRadius: 999,
                  }}>{f.statusLabel}</span>
                </div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--text)" }}>
                  {f.title}
                </h2>
                <p style={{ color: "var(--muted)", fontSize: "0.97rem", lineHeight: 1.7, marginBottom: "1.2rem" }}>
                  {f.description}
                </p>
                <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                  {f.details.map((d) => (
                    <li key={d} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.45rem" }}>
                      <span style={{ color: cfg.color, fontSize: "0.9rem", marginTop: "0.1rem" }}>✓</span>
                      <span style={{ color: "var(--muted)", fontSize: "0.92rem" }}>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div style={{
          marginTop: "3rem", background: "#1a1a2e", borderRadius: "1.2rem",
          padding: "2.5rem 2rem", textAlign: "center",
        }}>
          <p style={{ color: "#f97316", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.8rem" }}>
            Founding Members
          </p>
          <h2 style={{ color: "#fff", fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.75rem" }}>
            Chi entra ora ha accesso prioritario<br />a ogni nuova funzionalità
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "0.95rem", maxWidth: 480, margin: "0 auto 1.8rem" }}>
            Prezzi bloccati a vita. Feedback diretto sulle funzionalità. Nessuna sorpresa.
          </p>
          <a href="/auth" style={{
            display: "inline-block", background: "#f97316", color: "#fff",
            padding: "0.85rem 2.2rem", borderRadius: "0.6rem",
            fontWeight: 700, fontSize: "1rem", textDecoration: "none",
          }}>
            Inizia la prova gratuita →
          </a>
        </div>
      </div>
    </main>
  );
}
