"use client";

import { useState, useEffect } from "react";

const STEPS = [
  { icon: "1️⃣", text: "Vai su ristoagent.com e clicca \"Attiva gratis\"" },
  { icon: "2️⃣", text: "Crea un account — Google o email, nessuna carta richiesta" },
  { icon: "3️⃣", text: "Inserisci nome, orari e servizi del tuo locale (2 minuti)" },
  { icon: "4️⃣", text: "Crea il tuo bot Telegram con @BotFather e incolla il token" },
  { icon: "5️⃣", text: "Attiva e condividi il QR code — il bot risponde subito ai clienti" },
];

export default function ProactiveChat() {
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!dismissed) setVisible(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [dismissed]);

  function dismiss() {
    setVisible(false);
    setOpen(false);
    setDismissed(true);
  }

  if (!visible && !open) return null;

  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10,
    }}>
      {/* Chat window */}
      {open && (
        <div style={{
          width: 320, background: "#0f1610", border: "1px solid #1e2b20",
          borderRadius: 16, boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
          fontFamily: "'DM Sans', 'Segoe UI', sans-serif", overflow: "hidden",
          animation: "slideUp 0.25s ease",
        }}>
          {/* Header */}
          <div style={{
            background: "#0EA5E9", padding: "14px 16px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
              }}>🤖</div>
              <div>
                <div style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>RistoAgent</div>
                <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 11 }}>● online ora</div>
              </div>
            </div>
            <button onClick={dismiss} style={{
              background: "transparent", border: "none", color: "rgba(255,255,255,0.8)",
              fontSize: 18, cursor: "pointer", lineHeight: 1, padding: 4,
            }}>×</button>
          </div>

          {/* Messages */}
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Bot message */}
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", background: "#0EA5E9",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, flexShrink: 0,
              }}>🤖</div>
              <div style={{
                background: "#1a2b1e", borderRadius: "4px 12px 12px 12px",
                padding: "10px 12px", color: "#e8f0e9", fontSize: 13, lineHeight: 1.5,
                maxWidth: 240,
              }}>
                Ciao! 👋 Ecco come attivare il tuo assistente in <strong>10 minuti</strong>, completamente <strong>gratis per 15 giorni</strong>:
              </div>
            </div>

            {/* Steps */}
            <div style={{
              background: "#131f15", border: "1px solid #1e2b20", borderRadius: 10,
              padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8,
            }}>
              {STEPS.map((s) => (
                <div key={s.icon} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12, color: "#c8d8ca", lineHeight: 1.4 }}>
                  <span style={{ flexShrink: 0 }}>{s.icon}</span>
                  <span>{s.text}</span>
                </div>
              ))}
            </div>

            {/* Bot follow-up */}
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", background: "#0EA5E9",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, flexShrink: 0,
              }}>🤖</div>
              <div style={{
                background: "#1a2b1e", borderRadius: "4px 12px 12px 12px",
                padding: "10px 12px", color: "#e8f0e9", fontSize: 13, lineHeight: 1.5,
                maxWidth: 240,
              }}>
                Nessuna carta di credito — puoi fermarti quando vuoi. Hai domande?
              </div>
            </div>

            {/* CTA */}
            <a href="/auth" style={{
              display: "block", textAlign: "center", background: "#0EA5E9", color: "#fff",
              padding: "11px 16px", borderRadius: 999, fontWeight: 600, fontSize: 14,
              textDecoration: "none", marginTop: 4,
            }}>
              Attiva gratis ora →
            </a>
          </div>
        </div>
      )}

      {/* Bubble trigger */}
      {!open && visible && (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
          {/* Callout */}
          <div
            onClick={() => setOpen(true)}
            style={{
              background: "#0f1610", border: "1px solid #1e2b20",
              borderRadius: "12px 12px 4px 12px", padding: "10px 14px",
              color: "#e8f0e9", fontSize: 13, lineHeight: 1.5, maxWidth: 220,
              cursor: "pointer", boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              animation: "slideUp 0.3s ease",
            }}
          >
            Ti interessa sapere come attivare il tuo bot <strong>gratuitamente</strong>, passo dopo passo? 👇
            <button onClick={(e) => { e.stopPropagation(); dismiss(); }} style={{
              float: "right", background: "transparent", border: "none",
              color: "#5a6a62", fontSize: 14, cursor: "pointer", marginLeft: 6, lineHeight: 1,
            }}>×</button>
          </div>

          {/* Avatar button */}
          <button
            onClick={() => setOpen(true)}
            style={{
              width: 52, height: 52, borderRadius: "50%", background: "#0EA5E9",
              border: "none", cursor: "pointer", fontSize: 24,
              boxShadow: "0 4px 16px rgba(14,165,233,0.4)",
              flexShrink: 0,
            }}
          >
            🤖
          </button>
        </div>
      )}

      {/* Closed state — just avatar */}
      {open && (
        <button
          onClick={() => setOpen(false)}
          style={{
            width: 52, height: 52, borderRadius: "50%", background: "#0EA5E9",
            border: "none", cursor: "pointer", fontSize: 24,
            boxShadow: "0 4px 16px rgba(14,165,233,0.4)",
          }}
        >
          💬
        </button>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
