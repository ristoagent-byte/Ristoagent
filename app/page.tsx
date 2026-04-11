import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RistoAgent — Rispondi automaticamente ai clienti su Telegram",
  description:
    "RistoAgent gestisce prenotazioni, FAQ e conferme 24/7 su Telegram. La tua attività non perde mai un cliente.",
};

const benefits = [
  {
    icon: "⚡",
    title: "Risposta istantanea",
    body: "Ogni messaggio riceve una risposta in secondi, anche a mezzanotte. Nessun cliente aspetta, nessuna opportunità persa per lentezza.",
  },
  {
    icon: "📅",
    title: "Prenotazioni automatiche",
    body: "L'AI raccoglie data, orario e numero di persone, verifica la disponibilità e conferma direttamente in chat — senza che tu tocchi il telefono.",
  },
  {
    icon: "🎯",
    title: "Personalizzato per te",
    body: "Impara i tuoi servizi, gli orari e le politiche della tua attività. Risponde con il tono del tuo brand, non come un robot generico.",
  },
];

const plans = [
  {
    name: "Starter",
    price: "0",
    desc: "Perfetto per testare RistoAgent.",
    features: ["100 messaggi/mese", "1 numero WhatsApp", "FAQ automatiche", "Setup guidato"],
    cta: "Inizia gratis",
    featured: false,
  },
  {
    name: "Pro",
    price: "49",
    desc: "Per attività che vogliono crescere.",
    features: [
      "Messaggi illimitati",
      "Prenotazioni automatiche",
      "Integrazioni calendario",
      "Analisi e report",
      "Supporto prioritario",
    ],
    cta: "Start Free Trial",
    featured: true,
  },
];

export default function Home() {
  return (
    <>
      {/* NAV */}
      <nav className="nav">
        <span className="logo">
          Risto<span className="logo-accent">Agent</span>
        </span>
        <a href="/auth" className="nav-cta">
          Prova gratis
        </a>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-glow" aria-hidden />
        <span className="hero-tag">
          <span className="hero-dot" />
          Powered by AI · Telegram Bot
        </span>
        <h1>
          Rispondi <em>automaticamente</em>
          <br />
          ai clienti su WhatsApp
        </h1>
        <p className="subheadline">
          RistoAgent gestisce prenotazioni, FAQ e conferme 24/7 —<br />
          così la tua attività non perde mai un cliente.
        </p>
        <div className="cta-group">
          <a href="/auth" className="btn-primary">
            Start Free Trial
          </a>
          <a href="#benefits" className="btn-ghost">
            Come funziona →
          </a>
        </div>
        <p className="hero-note">Nessuna carta di credito · Setup in 5 minuti</p>

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
            <div className="bubble bubble-user">Ciao! Siete disponibili sabato mattina?</div>
          </div>
          <div className="bubble bubble-bot">
            Ciao! 😊 Sì, abbiamo disponibilità sabato. Preferisci le 10:00 o le 11:30?
          </div>
          <div className="msg-user">
            <div className="bubble bubble-user">Le 10:00 perfetto!</div>
          </div>
          <div className="typing">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </div>
        </div>
      </section>

      <hr className="divider" />

      {/* BENEFITS */}
      <section className="section" id="benefits">
        <p className="section-label">Vantaggi</p>
        <h2>
          Più clienti.
          <br />
          Meno lavoro manuale.
        </h2>
        <div className="benefits-grid">
          {benefits.map((b) => (
            <div key={b.title} className="benefit-card">
              <div className="benefit-icon">{b.icon}</div>
              <h3>{b.title}</h3>
              <p>{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      <hr className="divider" />

      {/* PRICING */}
      <section className="section pricing-section" id="pricing">
        <p className="section-label">Prezzi</p>
        <h2>Semplice e trasparente</h2>
        <p className="pricing-sub">Inizia gratis. Scala quando sei pronto.</p>
        <div className="pricing-grid">
          {plans.map((plan) => (
            <div key={plan.name} className={`plan ${plan.featured ? "plan-featured" : ""}`}>
              {plan.featured && <span className="plan-badge">Più popolare</span>}
              <p className="plan-name">{plan.name}</p>
              <p className="plan-price">
                <sup>€</sup>
                {plan.price}
                <small>/mese</small>
              </p>
              <p className="plan-desc">{plan.desc}</p>
              <ul className="plan-features">
                {plan.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <a href="/auth" className={plan.featured ? "btn-primary" : "btn-ghost"}>
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <span className="logo">
          Risto<span className="logo-accent">Agent</span>
        </span>
        <p>© 2025 RistoAgent. Tutti i diritti riservati.</p>
        <p className="footer-note">Made for local businesses 🇮🇹</p>
      </footer>
    </>
  );
}
