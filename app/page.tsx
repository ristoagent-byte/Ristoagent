"use client";
import { useState, useRef, useEffect } from "react";

const steps = [
  {
    n: "1",
    title: "Il cliente ti scrive su Telegram",
    body: "Scansiona il QR code al tavolo, sul menu o sui social. Apre Telegram e scrive — come farebbe con un amico.",
  },
  {
    n: "2",
    title: "L'assistente risponde in secondi",
    body: "Risponde a domande, raccoglie nome, data, ora e numero di persone. Gestisce anche i messaggi vocali.",
  },
  {
    n: "3",
    title: "La prenotazione appare nel tuo calendario",
    body: "Tutto salvato in automatico su Google Calendar. Tu ricevi una notifica, il cliente ha la conferma. Zero telefonate.",
  },
];

const benefits = [
  {
    icon: "⚡",
    title: "Risposta in meno di 5 secondi",
    body: "Il cliente scrive, l'assistente risponde prima che tu abbia finito di leggere il messaggio. Sempre.",
  },
  {
    icon: "📅",
    title: "Trasforma ogni messaggio in prenotazione",
    body: "Raccoglie nome, data, orario e numero di persone e aggiunge tutto a Google Calendar. Automaticamente.",
  },
  {
    icon: "📵",
    title: "Azzera le telefonate durante il servizio",
    body: "In sala, in cucina, impegnato — l'assistente gestisce tutto. Tu non devi interrompere il lavoro.",
  },
  {
    icon: "🌙",
    title: "Prende prenotazioni anche a mezzanotte",
    body: "Il sabato sera, la domenica mattina, alle 23:00. Ogni messaggio fuori orario diventa una prenotazione.",
  },
  {
    icon: "🌍",
    title: "Risponde in italiano e in inglese",
    body: "I turisti stranieri prenotano senza problemi. L'assistente cambia lingua in automatico.",
  },
  {
    icon: "🎙️",
    title: "Capisce anche i messaggi vocali",
    body: "Il cliente parla invece di scrivere? Nessun problema. L'assistente trascrive e risponde.",
  },
];

// Demo chat flow — alternating user/bot
const demoFlow: { from: "user" | "bot"; text: string; suggestions?: string[] }[] = [
  { from: "bot", text: "Ciao! 👋 Sono l'assistente del ristorante. Come posso aiutarti?", suggestions: ["Voglio prenotare un tavolo", "Siete aperti domenica?", "Avete posti per stasera?"] },
  { from: "user", text: "" }, // placeholder — filled by user input
  { from: "bot", text: "Perfetto! Per quante persone?" , suggestions: ["2 persone", "4 persone", "6 persone"] },
  { from: "user", text: "" },
  { from: "bot", text: "E per quale giorno e orario?", suggestions: ["Sabato sera", "Domani alle 20:00", "Venerdì alle 19:30"] },
  { from: "user", text: "" },
  { from: "bot", text: "A nome di chi faccio la prenotazione?", suggestions: ["Mario Rossi", "Giulia Bianchi"] },
  { from: "user", text: "" },
  { from: "bot", text: "✅ Perfetto! Ho registrato la prenotazione. Ti aspettiamo! Se hai bisogno scrivi pure qui 🍽" },
];

const plans = [
  {
    name: "Starter",
    price: "29",
    foundingPrice: "19",
    badge: null,
    billingNote: "Rinnovo mensile automatico",
    desc: "Per ristoranti con flusso regolare di prenotazioni.",
    features: [
      "300 messaggi/mese",
      "1 Bot Telegram",
      "Prenotazioni con Google Calendar",
      "FAQ automatiche",
      "QR code personalizzato",
    ],
    cta: "Inizia gratis",
    featured: false,
  },
  {
    name: "Pro",
    price: "49",
    foundingPrice: "29",
    badge: "Più scelto",
    billingNote: "Rinnovo mensile automatico",
    desc: "Per chi vuole zero limiti e massima crescita.",
    features: [
      "Messaggi illimitati",
      "1 Bot Telegram",
      "Prenotazioni con Google Calendar",
      "Messaggi vocali inclusi",
      "Analisi e report",
      "Supporto prioritario",
      "QR code personalizzato",
    ],
    cta: "Inizia gratis",
    featured: true,
  },
  {
    name: "Flessibile",
    price: "39",
    foundingPrice: null,
    badge: null,
    billingNote: "Nessun rinnovo automatico",
    desc: "Paghi solo i mesi che usi.",
    features: [
      "500 messaggi/mese",
      "1 Bot Telegram",
      "Prenotazioni con Google Calendar",
      "FAQ automatiche",
      "QR code personalizzato",
    ],
    cta: "Inizia gratis",
    featured: false,
  },
];

function InteractiveDemo() {
  const [messages, setMessages] = useState<{ from: "user" | "bot"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [step, setStep] = useState(0);
  const [typing, setTyping] = useState(false);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  async function start() {
    setStarted(true);
    setMessages([]);
    setStep(0);
    setTyping(false);
    setDone(false);
    setInput("");
    // Show first bot message
    setTyping(true);
    await new Promise(r => setTimeout(r, 700));
    setTyping(false);
    setMessages([{ from: "bot", text: demoFlow[0].text }]);
    setStep(1);
  }

  async function send(text?: string) {
    const userText = (text ?? input).trim();
    if (!userText || typing || done) return;
    setInput("");

    // Add user message
    setMessages(prev => [...prev, { from: "user", text: userText }]);

    // Find next bot reply
    const nextBotIndex = step + 1;
    if (nextBotIndex >= demoFlow.length) { setDone(true); return; }

    const nextBot = demoFlow[nextBotIndex];
    if (nextBot.from !== "bot") { setStep(nextBotIndex); return; }

    setTyping(true);
    await new Promise(r => setTimeout(r, 800 + Math.random() * 500));
    setTyping(false);
    setMessages(prev => [...prev, { from: "bot", text: nextBot.text }]);
    setStep(nextBotIndex + 1);
    if (nextBotIndex + 1 >= demoFlow.length) setDone(true);
  }

  const currentSuggestions = !done && step > 0 && step < demoFlow.length
    ? (demoFlow[step - 1]?.suggestions ?? [])
    : [];

  if (!started) {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{
          background: "var(--surface2)", border: "1px solid var(--border)",
          borderRadius: "1.4rem", padding: "3rem 2rem", maxWidth: 420, margin: "0 auto",
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>💬</div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            Prova il bot adesso
          </h3>
          <p style={{ color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
            Simula una prenotazione reale — esattamente quello che farebbe un tuo cliente.
          </p>
          <button onClick={start} className="btn-primary" style={{ width: "100%", border: "none", cursor: "pointer" }}>
            Inizia la simulazione →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 440, margin: "0 auto" }}>
      <div style={{
        background: "var(--surface2)", border: "1px solid var(--border)",
        borderRadius: "1.4rem", overflow: "hidden",
        boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
      }}>
        {/* Header */}
        <div style={{
          background: "#1a2f1c", padding: "1rem 1.2rem",
          display: "flex", alignItems: "center", gap: "0.7rem",
          borderBottom: "1px solid var(--border)",
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: "50%",
            background: "var(--green)", display: "flex",
            alignItems: "center", justifyContent: "center", fontSize: "1.1rem",
          }}>🍽</div>
          <div>
            <p style={{ fontWeight: 600, fontSize: "0.9rem" }}>Il tuo ristorante</p>
            <p style={{ color: "var(--green)", fontSize: "0.7rem" }}>● online</p>
          </div>
          <span style={{
            marginLeft: "auto", fontSize: "0.65rem", color: "var(--muted)",
            background: "var(--surface)", padding: "0.2rem 0.6rem",
            borderRadius: 999, border: "1px solid var(--border)",
          }}>simulazione</span>
        </div>

        {/* Messages */}
        <div style={{ padding: "1.2rem", minHeight: 220, maxHeight: 320, overflowY: "auto" }}>
          {messages.map((m, i) => (
            <div key={i} style={{
              display: "flex",
              justifyContent: m.from === "user" ? "flex-end" : "flex-start",
              marginBottom: "0.6rem",
            }}>
              <div style={{
                maxWidth: "80%", padding: "0.6rem 0.9rem",
                borderRadius: m.from === "user" ? "1rem 1rem 0.2rem 1rem" : "1rem 1rem 1rem 0.2rem",
                background: m.from === "user" ? "var(--green)" : "#1c2b1e",
                color: m.from === "user" ? "#0a0f0d" : "var(--text)",
                fontSize: "0.85rem", lineHeight: 1.5,
              }}>{m.text}</div>
            </div>
          ))}
          {typing && (
            <div style={{ display: "flex", gap: 4, padding: "0.6rem 0.9rem",
              background: "#1c2b1e", borderRadius: "1rem 1rem 1rem 0.2rem",
              width: "fit-content", marginBottom: "0.6rem" }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: "50%", background: "var(--muted)",
                  animation: "bounce 1.2s infinite", animationDelay: `${i * 0.2}s`,
                }} />
              ))}
            </div>
          )}
          {done && (
            <div style={{ textAlign: "center", marginTop: "0.8rem" }}>
              <button onClick={start} style={{
                background: "transparent", border: "1px solid var(--border)",
                color: "var(--muted)", fontSize: "0.75rem", padding: "0.4rem 1rem",
                borderRadius: 999, cursor: "pointer",
              }}>Ricomincia ↺</button>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Suggestions */}
        {currentSuggestions.length > 0 && !done && (
          <div style={{
            padding: "0 1.2rem 0.8rem",
            display: "flex", gap: "0.5rem", flexWrap: "wrap",
          }}>
            {currentSuggestions.map(s => (
              <button key={s} onClick={() => send(s)} style={{
                background: "transparent", border: "1px solid var(--border)",
                color: "var(--muted)", fontSize: "0.75rem", padding: "0.35rem 0.8rem",
                borderRadius: 999, cursor: "pointer", transition: "all 0.15s",
              }}>{s}</button>
            ))}
          </div>
        )}

        {/* Input */}
        {!done && (
          <div style={{
            padding: "0.8rem 1.2rem", borderTop: "1px solid var(--border)",
            display: "flex", gap: "0.6rem",
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Scrivi un messaggio..."
              style={{
                flex: 1, background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: 999, padding: "0.55rem 1rem", color: "var(--text)",
                fontSize: "0.85rem", fontFamily: "inherit", outline: "none",
              }}
            />
            <button onClick={() => send()} style={{
              background: "var(--green)", border: "none", borderRadius: "50%",
              width: 36, height: 36, cursor: "pointer", fontSize: "1rem",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>→</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      {/* NAV */}
      <nav className="nav">
        <a href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <img src="/logo.png" alt="RistoAgent" style={{ height: 40, width: "auto" }} />
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <a href="/auth" className="nav-login">Accedi</a>
          <a href="/auth" className="nav-cta">Prova gratis 15 giorni</a>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-glow" aria-hidden />

        <span className="hero-tag">
          <span className="hero-dot" />
          Attivo in 10 minuti — nessuna carta richiesta
        </span>

        <h1>
          Il tuo ristorante<br />
          prende prenotazioni<br />
          <em>anche quando dormi.</em>
        </h1>

        <p className="subheadline">
          RistoAgent risponde ai tuoi clienti 24 ore su 24 su Telegram —<br />
          gestisce prenotazioni, domande e messaggi vocali in automatico.<br />
          Tu guardi il calendario riempirsi.
        </p>

        <div className="cta-group">
          <a href="/auth" className="btn-primary">Attiva gratis per 15 giorni →</a>
          <a href="#demo" className="btn-ghost">Prova il bot ↓</a>
        </div>
        <p className="hero-note">
          Nessuna carta di credito · Nessun contratto · Setup in 10 minuti
        </p>

        {/* Chat preview */}
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-avatar">🍕</div>
            <div>
              <p className="chat-name">Il tuo ristorante</p>
              <p className="chat-status">● online</p>
            </div>
          </div>
          <div className="msg-user">
            <div className="bubble bubble-user">Ciao! Posso prenotare sabato sera per 4 persone?</div>
          </div>
          <div className="bubble bubble-bot">
            Ciao! 😊 Sabato sera ho disponibilità alle 19:30 e alle 21:00. Quale preferisci?
          </div>
          <div className="msg-user">
            <div className="bubble bubble-user">Le 19:30, grazie!</div>
          </div>
          <div className="bubble bubble-bot">
            Perfetto! Ho prenotato per 4 persone sabato alle 19:30. A nome di chi?
          </div>
          <div className="msg-user">
            <div className="bubble bubble-user">Mario Rossi</div>
          </div>
          <div className="bubble bubble-bot">
            ✅ Prenotato! Ti aspettiamo sabato, Mario. Se hai bisogno scrivi pure qui.
          </div>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────── */}
      <div className="stats-bar">
        {[
          { value: "+ prenotazioni", label: "24 ore su 24" },
          { value: "10 minuti", label: "Setup completo" },
          { value: "Nessuna app", label: "Per i tuoi clienti" },
          { value: "15 giorni", label: "Prova gratuita" },
        ].map((s) => (
          <div key={s.label} className="stat-item">
            <span className="stat-value">{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      <hr className="divider" />

      {/* ── PROBLEM ──────────────────────────────────── */}
      <section className="section" id="problema">
        <p className="section-label">Il problema</p>
        <h2>
          Ogni giorno perdi clienti<br />
          <em style={{ fontStyle: "italic", color: "var(--green)" }}>perché non rispondi in tempo.</em>
        </h2>
        <div className="benefits-grid" style={{ marginTop: "2.5rem" }}>
          {[
            {
              icon: "📵",
              title: "Durante il servizio non puoi rispondere",
              body: "Sei in sala, in cucina, al telefono. Il cliente scrive su Telegram e aspetta. Se non risponde entro qualche minuto, chiama il posto accanto.",
            },
            {
              icon: "🌙",
              title: "Di sera e nel weekend perdi richieste",
              body: "La maggior parte delle prenotazioni arriva fuori orario. Sabato sera, domenica mattina, a mezzanotte dopo una cena. Tu non sei lì.",
            },
            {
              icon: "🔁",
              title: "Perdi tempo a rispondere sempre alle stesse cose",
              body: "\"Siete aperti domenica?\" \"C'è il parcheggio?\" \"Accettate cani?\" — le stesse domande ogni giorno, per anni.",
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

      {/* ── HOW IT WORKS ─────────────────────────────── */}
      <section className="section" id="come-funziona">
        <p className="section-label">Come funziona</p>
        <h2>
          3 passi.<br />
          Zero telefonate.
        </h2>
        <p style={{ color: "var(--muted)", marginTop: "0.75rem", marginBottom: "3rem", fontSize: "1.05rem" }}>
          Il tuo assistente impara tutto del tuo locale e risponde ai clienti come faresti tu.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem", maxWidth: 620, margin: "0 auto" }}>
          {steps.map((s) => (
            <div key={s.n} style={{
              display: "flex", gap: "1.2rem", alignItems: "flex-start",
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "1rem", padding: "1.6rem 1.8rem",
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                background: "var(--green)", display: "flex", alignItems: "center",
                justifyContent: "center", fontWeight: 700, fontSize: "0.9rem", color: "#0a0f0d",
              }}>{s.n}</div>
              <div>
                <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.4rem" }}>{s.title}</h3>
                <p style={{ color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.7 }}>{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <hr className="divider" />

      {/* ── DEMO INTERATTIVA ─────────────────────────── */}
      <section className="section" id="demo">
        <p className="section-label">Prova dal vivo</p>
        <h2>
          Non ti fidiamo delle parole.<br />
          <em style={{ fontStyle: "italic", color: "var(--green)" }}>Provalo adesso.</em>
        </h2>
        <p style={{ color: "var(--muted)", marginTop: "0.75rem", marginBottom: "3rem", fontSize: "1.05rem" }}>
          Simula una prenotazione reale — esattamente quello che farebbe un tuo cliente.
        </p>
        <InteractiveDemo />
        <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.82rem", color: "var(--muted)" }}>
          Il tuo bot reale risponde con le informazioni del tuo locale, i tuoi orari e il tuo Google Calendar.
        </p>
      </section>

      <hr className="divider" />

      {/* ── BENEFITS ─────────────────────────────────── */}
      <section className="section" id="vantaggi">
        <p className="section-label">Perché funziona</p>
        <h2>
          Non è un chatbot.<br />
          È il tuo miglior dipendente.
        </h2>
        <p style={{ color: "var(--muted)", marginTop: "0.75rem", marginBottom: "3rem", fontSize: "1.05rem" }}>
          Disponibile sempre, non sbaglia mai e non chiede mai un giorno libero.
        </p>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.2rem",
          maxWidth: 960,
          margin: "0 auto",
        }}>
          {benefits.map((b) => (
            <div key={b.title} className="benefit-card-v2">
              <span className="benefit-icon-v2">{b.icon}</span>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.4rem" }}>{b.title}</h3>
              <p style={{ color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.7 }}>{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      <hr className="divider" />

      {/* ── QR CODE ──────────────────────────────────── */}
      <section className="section" id="qrcode">
        <div style={{
          display: "flex", gap: "3rem", alignItems: "center", flexWrap: "wrap",
          justifyContent: "center", maxWidth: 820, margin: "0 auto",
        }}>
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

          <div style={{ flex: 1, minWidth: 260 }}>
            <p className="section-label">Un QR code che vale oro</p>
            <h2 style={{ marginBottom: "1rem" }}>
              I clienti lo inquadrano<br />e prenotano subito.<br />
              <span style={{ color: "var(--green)", fontStyle: "italic" }}>Senza scaricare nulla.</span>
            </h2>
            <p style={{ color: "var(--muted)", lineHeight: 1.7, marginBottom: "1.5rem" }}>
              Mettilo sul menu, ai tavoli, sulla vetrina o sui social.
              I clienti aprono la fotocamera, inquadrano e atterrano
              direttamente nella chat con il tuo assistente. Zero attriti.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {[
                "Sul menu, ai tavoli e alla cassa",
                "Sui volantini e nelle campagne social",
                "Scaricabile in alta risoluzione dalla dashboard",
                "Funziona con qualsiasi fotocamera",
              ].map((f) => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <span style={{ color: "var(--green)", fontSize: "0.8rem", fontWeight: 700 }}>✓</span>
                  <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <hr className="divider" />

      {/* ── PRICING ──────────────────────────────────── */}
      <section className="section pricing-section" id="pricing">
        <p className="section-label">Prezzi</p>
        <h2>Semplice e trasparente</h2>
        <p className="pricing-sub" style={{ marginTop: "0.75rem" }}>
          15 giorni gratis, poi scegli il piano. Nessuna carta richiesta per iniziare.
        </p>

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
            Pro a <strong style={{ color: "#fde68a" }}>€29/mese</strong> (invece di €49) ·{" "}
            <strong style={{ color: "#fde68a" }}>Bloccato per sempre</strong>
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
                {plan.foundingPrice ? (
                  <>
                    <sup>€</sup>{plan.foundingPrice}<small>/mese</small>
                    <span className="plan-old-price">€{plan.price}</span>
                  </>
                ) : (
                  <><sup>€</sup>{plan.price}<small>/mese</small></>
                )}
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

      {/* ── ROADMAP ──────────────────────────────────── */}
      <section className="section" id="roadmap">
        <p className="section-label">Visione futura</p>
        <h2>Oggi gestisce i clienti.<br />Domani gestisce il tuo business.</h2>
        <p style={{ color: "var(--muted)", marginTop: "0.75rem", marginBottom: "3rem", fontSize: "1.05rem", textAlign: "center" }}>
          Chi entra ora come Founding Member avrà accesso prioritario a tutte le nuove funzionalità.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.2rem", maxWidth: 900, margin: "0 auto" }}>
          {[
            { icon: "🛒", label: "In arrivo", title: "Ordinazioni dirette", body: "I clienti potranno ordinare direttamente via Telegram con il tuo menù digitale integrato." },
            { icon: "🎯", label: "In arrivo", title: "Promozioni mirate", body: "Invia offerte personalizzate: sconti sul compleanno, happy hour, promozioni last-minute." },
            { icon: "🎟️", label: "In arrivo", title: "Buoni sconto", body: "Crea e distribuisci coupon digitali via Telegram. Il cliente li usa alla cassa, tu monitori i riscatti." },
            { icon: "📊", label: "In arrivo", title: "Analisi fatturato", body: "Dashboard con andamento vendite, piatti più ordinati e fasce orarie più redditizie." },
            { icon: "📦", label: "In arrivo", title: "Gestione magazzino", body: "L'agente ti avvisa quando un ingrediente sta per finire e ti suggerisce gli acquisti." },
            { icon: "🧠", label: "In arrivo", title: "Strategia marketing AI", body: "L'agente analizza i tuoi dati e genera un piano d'azione concreto per far crescere il locale." },
            { icon: "🌐", label: "In arrivo", title: "Widget per il sito web", body: "Aggiungi il chatbot al tuo sito con un copia-incolla. I clienti chattano senza aprire Telegram." },
            { icon: "🎙️", label: "Disponibile ora", title: "Messaggi vocali", body: "L'agente capisce e risponde anche ai messaggi vocali. Il cliente parla, l'agente prenota." },
          ].map((item) => {
            const isLive = item.label === "Disponibile ora";
            return (
              <div key={item.title} style={{
                background: "var(--surface)", border: `1px solid ${isLive ? "rgba(249,115,22,0.35)" : "var(--border)"}`,
                borderRadius: "1rem", padding: "1.4rem 1.5rem",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.8rem" }}>
                  <span style={{ fontSize: "1.4rem" }}>{item.icon}</span>
                  <span style={{
                    fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: isLive ? "#f97316" : "var(--green)",
                    background: isLive ? "rgba(249,115,22,0.1)" : "rgba(14,165,233,0.1)",
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
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/auth" className="btn-primary">Entra ora →</a>
            <a href="/roadmap" className="btn-secondary">Vedi roadmap completa</a>
          </div>
        </div>
      </section>

      <hr className="divider" />

      {/* ── FINAL CTA ────────────────────────────────── */}
      <section className="final-cta">
        <div className="final-cta-glow" aria-hidden />
        <p className="section-label" style={{ textAlign: "center" }}>Inizia oggi</p>
        <h2 style={{ textAlign: "center", maxWidth: 680, margin: "0 auto" }}>
          Non perdere più una prenotazione,<br />
          <em style={{ fontStyle: "italic", color: "var(--green)" }}>neanche di notte.</em>
        </h2>
        <p style={{
          textAlign: "center", color: "var(--muted)",
          fontSize: "1.05rem", maxWidth: 520, margin: "1.2rem auto 2.5rem",
        }}>
          15 giorni gratis. Setup in 10 minuti. Nessuna carta richiesta.
          Smetti di perdere clienti oggi stesso.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
          <a href="/auth" className="btn-primary" style={{ fontSize: "1.1rem", padding: "1rem 2.5rem" }}>
            Attiva gratis il tuo assistente →
          </a>
        </div>
        <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.8rem", color: "var(--muted)" }}>
          Nessun contratto · Disdici quando vuoi · Supporto incluso
        </p>
      </section>

      {/* ── FOOTER ───────────────────────────────────── */}
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
