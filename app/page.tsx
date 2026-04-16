import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RistoAgent — Agente AI per prenotazioni ristorante su Telegram",
  description:
    "RistoAgent gestisce prenotazioni, cancellazioni e messaggi Telegram per il tuo ristorante, 24h su 24. Setup in 10 minuti, prova gratis 15 giorni.",
};

const steps = [
  {
    n: "1",
    title: "Configura la tua attività",
    body: "Inserisci i tuoi servizi, orari e collega Google Calendar. Ci vogliono 10 minuti.",
  },
  {
    n: "2",
    title: "Attiva il tuo agente AI su Telegram",
    body: "Ricevi una guida passo-passo. In 5 minuti il tuo bot Telegram è attivo e risponde ai clienti del ristorante.",
  },
  {
    n: "3",
    title: "I clienti scrivono, l'agente risponde",
    body: "Prenotazioni, domande, conferme — tutto gestito in automatico. Tu guardi i risultati dalla dashboard.",
  },
];

const plans = [
  {
    name: "Starter",
    price: "29",
    badge: null,
    billingNote: "Rinnovo mensile automatico",
    desc: "Per ristoranti con flusso regolare di prenotazioni.",
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
          L&apos;agente AI per ristoranti — prenotazioni, messaggi e clienti automatizzati
        </span>

        <h1>
          Non hai tempo<br />
          per rispondere<br />
          <em>ai tuoi clienti?</em>
        </h1>

        <p className="subheadline">
          RistoAgent è l&apos;agente AI per il tuo ristorante — risponde al posto tuo 24 ore su 24, 7 giorni su 7.<br />
          Gestisce prenotazioni, cancellazioni, messaggi scritti e vocali su Telegram<br />
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
          RistoAgent impara la tua attività e risponde ai clienti del tuo ristorante come faresti tu —<br />
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

      {/* QR CODE */}
      <section className="section" id="qrcode">
        <div style={{
          display: "flex", gap: "3rem", alignItems: "center", flexWrap: "wrap",
          justifyContent: "center", maxWidth: 820, margin: "0 auto",
        }}>
          {/* QR mockup */}
          <div style={{
            background: "#ffffff", borderRadius: "1.2rem", padding: "1.5rem",
            display: "flex", flexDirection: "column", alignItems: "center", gap: "0.8rem",
            boxShadow: "0 0 60px rgba(14,165,233,0.15)", flexShrink: 0,
          }}>
            <div style={{
              width: 120, height: 120, background: "#f0f0f0", borderRadius: "0.6rem",
              display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4, padding: 10,
            }}>
              {Array.from({ length: 25 }).map((_, i) => (
                <div key={i} style={{
                  background: [0,1,2,5,9,10,14,15,19,20,21,22,24].includes(i) ? "#1a1a2e" : "#f0f0f0",
                  borderRadius: 2,
                }} />
              ))}
            </div>
            <p style={{ fontSize: "0.7rem", color: "#64748b", fontFamily: "monospace" }}>
              t.me/tuoristorante_bot
            </p>
          </div>

          {/* Testo */}
          <div style={{ flex: 1, minWidth: 260 }}>
            <p className="section-label">QR Code incluso</p>
            <h2 style={{ marginBottom: "1rem" }}>
              Un QR code che porta<br />i clienti direttamente<br />al tuo bot.
            </h2>
            <p style={{ color: "var(--muted)", lineHeight: 1.7, marginBottom: "1.5rem" }}>
              Appena crei il tuo account ricevi un QR code personalizzato.
              Mettilo ovunque i tuoi clienti ti trovano — i clienti lo inquadrano
              e atterrano direttamente sulla chat Telegram con il tuo assistente.
              Zero app da scaricare, zero attriti.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {[
                "Sul menu, sui tavoli e alla cassa",
                "Sui volantini e nelle campagne social",
                "Scaricabile in alta risoluzione dalla dashboard",
                "Funziona con qualsiasi fotocamera",
              ].map((f) => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <span style={{ color: "var(--green)", fontSize: "0.75rem" }}>✓</span>
                  <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
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

        {/* Founding Members */}
        <div style={{
          background: "linear-gradient(135deg, #1a0f00, #0f0a00)",
          border: "1px solid #f97316", borderRadius: "1rem",
          padding: "1.5rem 2rem", marginBottom: "2rem", textAlign: "center",
        }}>
          <p style={{ color: "#f97316", fontWeight: 700, fontSize: "0.75rem",
            textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.4rem" }}>
            🔥 Offerta Founding Members — Solo 20 posti
          </p>
          <p style={{ color: "#fde68a", fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.3rem" }}>
            Entra adesso e blocca il prezzo per sempre
          </p>
          <p style={{ color: "#92400e", fontSize: "0.85rem", marginBottom: "1.2rem" }}>
            Starter a <strong style={{ color: "#fde68a" }}>€19/mese</strong> (invece di €29) ·
            Pro a <strong style={{ color: "#fde68a" }}>€29/mese</strong> (invece di €49)
          </p>
          <a href="/auth" className="btn-primary" style={{ background: "#f97316" }}>
            Approfitta dell&apos;offerta →
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

      <hr className="divider" />

      {/* ROADMAP */}
      <section className="section" id="roadmap">
        <p className="section-label">Visione futura</p>
        <h2>Oggi gestisce i clienti.<br />Domani gestisce il tuo business.</h2>
        <p style={{ color: "var(--muted)", marginTop: "0.75rem", marginBottom: "3rem", fontSize: "1.05rem", textAlign: "center" }}>
          RistoAgent diventerà una piattaforma integrata per ogni aspetto della tua attività.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.2rem", maxWidth: 900, margin: "0 auto" }}>
          {[
            { icon: "🛒", label: "In arrivo", title: "Ordinazioni dirette", body: "I clienti potranno ordinare direttamente via Telegram — antipasti, piatti, bevande — con il tuo menù digitale integrato." },
            { icon: "🎯", label: "In arrivo", title: "Promozioni mirate", body: "Invia offerte personalizzate ai clienti che hai già servito: sconti sul compleanno, happy hour, promozioni last-minute." },
            { icon: "🎟️", label: "In arrivo", title: "Buoni sconto", body: "Crea e distribuisci coupon digitali direttamente via Telegram. Il cliente li usa alla cassa, tu monitori i riscatti." },
            { icon: "📦", label: "In arrivo", title: "Gestione magazzino", body: "Collega le ordinazioni alle scorte. L'agente ti avvisa quando un ingrediente sta per finire e ti suggerisce gli acquisti." },
            { icon: "📊", label: "In arrivo", title: "Analisi fatturato", body: "Dashboard con andamento vendite, piatti più ordinati, fasce orarie più redditizie e confronto settimana su settimana." },
            { icon: "🧠", label: "In arrivo", title: "Strategia di marketing AI", body: "L'agente analizza i tuoi dati e genera un piano d'azione concreto: quali clienti recuperare, quando fare promozioni, cosa comunicare." },
            { icon: "📈", label: "In arrivo", title: "Analisi di mercato", body: "Dati aggregati anonimi su clienti, preferenze e abitudini nel tuo quartiere. Capisci il mercato locale prima dei tuoi competitor." },
            { icon: "🎙️", label: "Disponibile ora", title: "Messaggi vocali", body: "L'agente capisce e risponde anche ai messaggi vocali su Telegram. Il cliente parla, l'agente trascrive, elabora e risponde." },
          ].map((item) => {
            const isLive = item.label === "Disponibile ora";
            return (
            <div key={item.title} style={{
              background: "var(--surface)", border: `1px solid ${isLive ? "rgba(249,115,22,0.35)" : "var(--border)"}`,
              borderRadius: "1rem", padding: "1.4rem 1.5rem", position: "relative",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.8rem" }}>
                <span style={{ fontSize: "1.4rem" }}>{item.icon}</span>
                <span style={{
                  fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: isLive ? "#f97316" : "var(--green)",
                  background: isLive ? "rgba(249,115,22,0.1)" : "rgba(34,197,94,0.1)",
                  padding: "0.2rem 0.6rem", borderRadius: 999,
                }}>{item.label}</span>
              </div>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.5rem" }}>{item.title}</h3>
              <p style={{ color: "var(--muted)", fontSize: "0.85rem", lineHeight: 1.6 }}>{item.body}</p>
            </div>
            );
          })}
        </div>

        <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "1.2rem" }}>
            Chi entra ora come Founding Member avrà accesso prioritario a tutte le nuove funzionalità.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/auth" className="btn-primary">Entra ora →</a>
            <a href="/roadmap" className="btn-secondary">Vedi roadmap completa</a>
          </div>
        </div>
      </section>

      <hr className="divider" />

      {/* FOOTER */}
      <footer className="footer">
        <img src="/logo.png" alt="RistoAgent" style={{ height: 36, width: "auto", borderRadius: 6, marginBottom: 4 }} />
        <p>© 2026 RistoAgent — Alessandro Bernabé · IČO 06043194 · Praha, CZ</p>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
          <a href="/legal" style={{ fontSize: "0.72rem", color: "#3a5c3e", textDecoration: "none" }}>Note legali</a>
          <a href="/privacy" style={{ fontSize: "0.72rem", color: "#3a5c3e", textDecoration: "none" }}>Privacy Policy</a>
          <a href="/privacy#cookie" style={{ fontSize: "0.72rem", color: "#3a5c3e", textDecoration: "none" }}>Cookie Policy</a>
          <a href="/terms" style={{ fontSize: "0.72rem", color: "#3a5c3e", textDecoration: "none" }}>Termini di Servizio</a>
          <span style={{ fontSize: "0.72rem", color: "#3a5c3e" }}>Made for local businesses 🇮🇹</span>
        </div>
      </footer>
    </>
  );
}
