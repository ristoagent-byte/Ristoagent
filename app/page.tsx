import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RistoAgent — Il tuo assistente Telegram che non dorme mai",
  description:
    "Non hai tempo per rispondere ai clienti? RistoAgent gestisce prenotazioni e messaggi Telegram al posto tuo, 24 ore su 24.",
};

const steps = [
  {
    n: "1",
    title: "Configura la tua attività",
    body: "Inserisci i tuoi servizi, orari e collega Google Calendar. Ci vogliono 10 minuti.",
  },
  {
    n: "2",
    title: "Crea il bot Telegram",
    body: "Con BotFather (gratuito) ottieni un token. Lo incolli in RistoAgent e il bot è pronto.",
  },
  {
    n: "3",
    title: "I clienti scrivono, il bot risponde",
    body: "Prenotazioni, domande, conferme — tutto gestito in automatico. Tu guardi i risultati dalla dashboard.",
  },
];

const plans = [
  {
    name: "Starter",
    price: "29",
    badge: null,
    billingNote: "Rinnovo mensile automatico",
    desc: "Per attività con clienti abituali.",
    features: [
      "300 messaggi/mese",
      "1 Bot Telegram",
      "Prenotazioni con Google Calendar",
      "FAQ automatiche",
    ],
    cta: "Scegli",
    featured: false,
  },
  {
    name: "Pro",
    price: "49",
    badge: "Più scelto",
    billingNote: "Rinnovo mensile automatico",
    desc: "Per chi vuole zero limiti.",
    features: [
      "Messaggi illimitati",
      "1 Bot Telegram",
      "Prenotazioni con Google Calendar",
      "Analisi e report",
      "Supporto prioritario",
    ],
    cta: "Scegli",
    featured: true,
  },
  {
    name: "Flessibile",
    price: "39",
    badge: null,
    billingNote: "Nessun rinnovo automatico",
    desc: "Paghi solo i mesi che usi.",
    features: [
      "500 messaggi/mese",
      "1 Bot Telegram",
      "Prenotazioni con Google Calendar",
      "FAQ automatiche",
    ],
    cta: "Scegli",
    featured: false,
  },
];

export default function Home() {
  return (
    <>
      {/* NAV */}
      <nav className="nav">
        <a href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <img src="/logo.png" alt="RistoAgent" style={{ height: 40, width: "auto" }} />
        </a>
        <a href="/auth" className="nav-cta">Prova gratis</a>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-glow" aria-hidden />

        <span className="hero-tag">
          <span className="hero-dot" />
          Il tuo assistente virtuale che risponde ai clienti e gestisce prenotazioni
        </span>

        <h1>
          Non hai tempo<br />
          per rispondere<br />
          <em>ai tuoi clienti?</em>
        </h1>

        <p className="subheadline">
          RistoAgent risponde al posto tuo — 24 ore su 24, 7 giorni su 7, anche di notte.<br />
          Gestisce prenotazioni, domande e conferme su Telegram<br />
          mentre tu pensi al tuo lavoro.
        </p>

        <div className="cta-group">
          <a href="/auth" className="btn-primary">Inizia ora →</a>
          <a href="#come-funziona" className="btn-ghost">Come funziona</a>
        </div>
        <p className="hero-note">Nessuna carta di credito · Setup in 10 minuti</p>

        {/* Chat preview */}
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-avatar">🏪</div>
            <div>
              <p className="chat-name">La tua attività</p>
              <p className="chat-status">● online</p>
            </div>
          </div>
          <div className="msg-user">
            <div className="bubble bubble-user">Ciao! Siete disponibili sabato sera per 4 persone?</div>
          </div>
          <div className="bubble bubble-bot">
            Ciao! 😊 Sì, abbiamo disponibilità sabato sera. Preferisci le 19:30 o le 21:00?
          </div>
          <div className="msg-user">
            <div className="bubble bubble-user">Le 19:30 perfetto!</div>
          </div>
          <div className="bubble bubble-bot">
            Perfetto, ho prenotato per 4 persone sabato alle 19:30. Ti aspettiamo! 📍
          </div>
        </div>
      </section>

      <hr className="divider" />

      {/* PROBLEM */}
      <section className="section" id="problema">
        <p className="section-label">Il problema</p>
        <h2>
          Ogni messaggio<br />
          senza risposta<br />
          è un cliente perso.
        </h2>
        <div className="benefits-grid" style={{ marginTop: "2.5rem" }}>
          {[
            {
              icon: "😤",
              title: "Rispondi sempre tu",
              body: "Weekend, sera, durante il servizio — il telefono non smette mai di suonare. E se non rispondi in tempo, il cliente va altrove.",
            },
            {
              icon: "📋",
              title: "Le prenotazioni si perdono",
              body: "Messaggi su Telegram, chiamate, Instagram — tenerli tutti sotto controllo è impossibile. Qualcosa sfugge sempre.",
            },
            {
              icon: "🔁",
              title: "Sempre le stesse domande",
              body: "\"Siete aperti domenica?\" \"Accettate carte?\" \"C'è il parcheggio?\" — rispondi le stesse cose decine di volte al giorno.",
            },
          ].map((b) => (
            <div key={b.title} className="benefit-card">
              <div className="benefit-icon">{b.icon}</div>
              <h3>{b.title}</h3>
              <p>{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      <hr className="divider" />

      {/* SOLUTION */}
      <section className="section" id="come-funziona">
        <p className="section-label">La soluzione</p>
        <h2>
          Un assistente che<br />
          non si stanca mai.
        </h2>
        <p style={{ color: "var(--muted)", marginTop: "0.75rem", marginBottom: "3rem", fontSize: "1.05rem" }}>
          RistoAgent impara la tua attività e risponde ai clienti come faresti tu —<br />
          in italiano o in inglese, a qualsiasi ora.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: 600, margin: "0 auto" }}>
          {steps.map((s) => (
            <div key={s.n} style={{
              display: "flex", gap: "1.2rem", alignItems: "flex-start",
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "1rem", padding: "1.4rem 1.6rem",
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                background: "var(--green)", display: "flex", alignItems: "center",
                justifyContent: "center", fontWeight: 700, fontSize: "0.9rem", color: "#fff",
              }}>{s.n}</div>
              <div>
                <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.3rem" }}>{s.title}</h3>
                <p style={{ color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <hr className="divider" />

      {/* PRICING */}
      <section className="section pricing-section" id="pricing">
        <p className="section-label">Prezzi</p>
        <h2>Semplice e trasparente</h2>

        <div className="trial-banner">
          <div className="trial-banner-left">
            <span className="trial-tag">Prova gratuita</span>
            <p className="trial-title">15 giorni gratis — nessuna carta richiesta</p>
            <p className="trial-desc">
              Un'unica prova per attività. Dopo 15 giorni scegli il piano più adatto.
            </p>
          </div>
          <a href="/auth" className="btn-primary" style={{ whiteSpace: "nowrap" }}>
            Scegli →
          </a>
        </div>

        <div className="pricing-grid">
          {plans.map((plan) => (
            <div key={plan.name} className={`plan ${plan.featured ? "plan-featured" : ""}`}>
              {plan.badge && <span className="plan-badge">{plan.badge}</span>}
              <p className="plan-name">{plan.name}</p>
              <p className="plan-price">
                <sup>€</sup>{plan.price}<small>/mese</small>
              </p>
              <p className="plan-billing-note">{plan.billingNote}</p>
              <p className="plan-desc">{plan.desc}</p>
              <ul className="plan-features">
                {plan.features.map((f) => <li key={f}>{f}</li>)}
              </ul>
              <a href="/auth" className={plan.featured ? "btn-primary" : "btn-ghost"}>{plan.cta}</a>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <img src="/logo.png" alt="RistoAgent" style={{ height: 36, width: "auto", borderRadius: 6, marginBottom: 4 }} />
        <p>© 2026 RistoAgent — Alessandro Bernabé · IČO 06043194 · Praha, CZ</p>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
          <a href="/legal" style={{ fontSize: "0.72rem", color: "#3a5c3e", textDecoration: "none" }}>Note legali</a>
          <a href="/privacy" style={{ fontSize: "0.72rem", color: "#3a5c3e", textDecoration: "none" }}>Privacy Policy</a>
          <a href="/terms" style={{ fontSize: "0.72rem", color: "#3a5c3e", textDecoration: "none" }}>Termini di Servizio</a>
          <span style={{ fontSize: "0.72rem", color: "#3a5c3e" }}>Made for local businesses 🇮🇹</span>
        </div>
      </footer>
    </>
  );
}
