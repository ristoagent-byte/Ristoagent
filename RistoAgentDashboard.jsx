import { useState, useEffect, useRef } from "react";

const RESTAURANT_RESPONSES = [
  { trigger: /prenot|book|reserv|tavol/i, response: "Certo! Per quante persone e a che ora desidera prenotare? Abbiamo disponibilità stasera alle 20:00 e alle 21:30. 🍽️" },
  { trigger: /menu|piatt|mangia|cena|pranzo/i, response: "Ecco i nostri piatti del giorno:\n\n🥩 Tagliata di manzo — €18\n🍝 Cacio e pepe — €12\n🐟 Branzino al forno — €22\n🍰 Tiramisù della casa — €7\n\nVuole prenotare un tavolo?" },
  { trigger: /orari|aperto|chiuso|quando/i, response: "Siamo aperti dal martedì alla domenica:\n🕐 Pranzo: 12:00 – 15:00\n🕗 Cena: 19:00 – 23:00\n\nLunedì chiuso. Posso aiutarla con una prenotazione?" },
  { trigger: /alleg|intoll|glutine|vegan|celiac/i, response: "Certamente! Abbiamo diverse opzioni:\n🌿 3 piatti vegani\n🚫🌾 5 piatti senza glutine\n🥛 Opzioni senza lattosio\n\nIl nostro chef può adattare molti piatti alle sue esigenze. Vuole saperne di più?" },
  { trigger: /graz|thank|ok|perfett|bene/i, response: "Grazie a lei! 😊 Se ha bisogno di altro, sono qui. Buona giornata!" },
  { trigger: /ciao|salve|buon/i, response: "Ciao! 👋 Benvenuto alla Trattoria da Mario. Come posso aiutarla? Posso assisterla con prenotazioni, menu, o informazioni sul ristorante." },
  { trigger: /prezz|cost|quanto/i, response: "I nostri prezzi vanno dai €10 per i primi ai €25 per i secondi di pesce. Il menu degustazione è a €45 per persona, bevande escluse. Vuole vedere il menu completo?" },
  { trigger: /parcheggi|arriva|dove|indirizzo|mappa/i, response: "📍 Ci troviamo in Via Roma 42, Milano.\nParcheggio convenzionato in Via Dante 15 (2min a piedi).\n🚇 Metro: fermata Duomo, uscita 3.\n\nVuole che le invii la posizione su Google Maps?" },
];

const DEFAULT_RESPONSE = "Grazie per il messaggio! Posso aiutarla con:\n\n📅 Prenotazioni\n📋 Menu e piatti del giorno\n🕐 Orari di apertura\n📍 Come raggiungerci\n\nCosa le interessa?";

function getAIResponse(message) {
  const match = RESTAURANT_RESPONSES.find(r => r.trigger.test(message));
  return match ? match.response : DEFAULT_RESPONSE;
}

const METRICS = [
  { label: "Messaggi gestiti", value: "1,247", sub: "Questo mese", icon: "💬", delta: "+18%" },
  { label: "Prenotazioni generate", value: "89", sub: "Da conversazioni", icon: "📅", delta: "+24%" },
  { label: "Tempo risparmiato", value: "32h", sub: "Questo mese", icon: "⏱️", delta: "+12%" },
  { label: "Tasso di risposta", value: "98.5%", sub: "< 30 secondi", icon: "⚡", delta: "+3%" },
];

const WEEKLY_DATA = [
  { day: "Lun", msgs: 42 }, { day: "Mar", msgs: 58 }, { day: "Mer", msgs: 35 },
  { day: "Gio", msgs: 67 }, { day: "Ven", msgs: 88 }, { day: "Sab", msgs: 95 },
  { day: "Dom", msgs: 72 },
];

const INITIAL_MESSAGES = [
  { id: 1, text: "Ciao, vorrei sapere se avete un tavolo per stasera", sender: "user", time: "18:32" },
  { id: 2, text: "Ciao! 👋 Certo, per quante persone? Stasera abbiamo disponibilità alle 20:00 e alle 21:30. 🍽️", sender: "ai", time: "18:32" },
  { id: 3, text: "Per 4 persone alle 20:00 perfetto", sender: "user", time: "18:33" },
  { id: 4, text: "Perfetto! Ho prenotato un tavolo per 4 alle 20:00. A nome di chi confermo la prenotazione? 😊", sender: "ai", time: "18:33" },
];

function MiniChart({ data }) {
  const max = Math.max(...data.map(d => d.msgs));
  return (
    <div style={{ display: "flex", alignItems: "end", gap: 6, height: 64, padding: "8px 0" }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
          <div
            style={{
              width: "100%",
              height: `${(d.msgs / max) * 48}px`,
              background: "linear-gradient(to top, #25D366, #128C7E)",
              borderRadius: 4,
              minHeight: 4,
              transition: "height 0.6s cubic-bezier(.4,0,.2,1)",
            }}
          />
          <span style={{ fontSize: 10, color: "#8696a0", fontWeight: 500 }}>{d.day}</span>
        </div>
      ))}
    </div>
  );
}

export default function RistoAgentDashboard() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    const userMsg = { id: Date.now(), text: input.trim(), sender: "user", time };
    setMessages(prev => [...prev, userMsg]);
    const userText = input.trim();
    setInput("");
    setTyping(true);

    setTimeout(() => {
      const aiResponse = getAIResponse(userText);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: aiResponse,
        sender: "ai",
        time: `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`,
      }]);
      setTyping(false);
    }, 1200 + Math.random() * 800);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0f0d",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      color: "#e9edef",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a3a32; border-radius: 10px; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 80%, 100% { opacity: .4; transform: scale(.8); } 40% { opacity: 1; transform: scale(1); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>

      {/* Header */}
      <header style={{
        padding: "20px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid #1a2620",
        background: "linear-gradient(180deg, #0d1410 0%, #0a0f0d 100%)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "linear-gradient(135deg, #25D366, #128C7E)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: 700,
            boxShadow: "0 0 24px rgba(37,211,102,.25)",
          }}>R</div>
          <div>
            <h1 style={{
              fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em",
              fontFamily: "'Space Mono', monospace",
            }}>RistoAgent</h1>
            <p style={{ fontSize: 12, color: "#25D366", fontWeight: 500 }}>● Attivo su WhatsApp</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, background: "#111a15", borderRadius: 10, padding: 3 }}>
          {["chat", "stats"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.2s",
              background: activeTab === tab ? "#25D366" : "transparent",
              color: activeTab === tab ? "#0a0f0d" : "#8696a0",
            }}>
              {tab === "chat" ? "💬 Chat" : "📊 Metriche"}
            </button>
          ))}
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 24px 40px" }}>
        {/* Metrics Row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 14,
          marginBottom: 24,
        }}>
          {METRICS.map((m, i) => (
            <div key={i} style={{
              background: "#111a15",
              borderRadius: 16,
              padding: "20px 22px",
              border: "1px solid #1a2620",
              animation: `fadeUp 0.5s ${i * 0.08}s both`,
              transition: "border-color 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#25D366"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "#1a2620"}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <span style={{ fontSize: 28 }}>{m.icon}</span>
                <span style={{
                  fontSize: 11, fontWeight: 600, color: "#25D366",
                  background: "rgba(37,211,102,.1)",
                  padding: "3px 8px", borderRadius: 6,
                }}>{m.delta}</span>
              </div>
              <p style={{
                fontSize: 32, fontWeight: 700, marginTop: 10,
                fontFamily: "'Space Mono', monospace",
                letterSpacing: "-0.03em",
              }}>{m.value}</p>
              <p style={{ fontSize: 13, color: "#8696a0", marginTop: 2 }}>{m.label}</p>
              <p style={{ fontSize: 11, color: "#5a6a62", marginTop: 1 }}>{m.sub}</p>
            </div>
          ))}
        </div>

        {activeTab === "stats" ? (
          /* Stats View */
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14,
            animation: "fadeUp 0.4s both",
          }}>
            <div style={{
              background: "#111a15", borderRadius: 16, padding: 24,
              border: "1px solid #1a2620",
            }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "#8696a0" }}>
                Messaggi per giorno
              </h3>
              <MiniChart data={WEEKLY_DATA} />
            </div>
            <div style={{
              background: "#111a15", borderRadius: 16, padding: 24,
              border: "1px solid #1a2620",
            }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "#8696a0" }}>
                Conversazioni recenti
              </h3>
              {[
                { name: "Marco R.", topic: "Prenotazione cena", status: "✅ Completata" },
                { name: "Laura B.", topic: "Info menu vegano", status: "✅ Completata" },
                { name: "Giovanni P.", topic: "Evento privato", status: "🔄 In corso" },
                { name: "Sara M.", topic: "Allergie e intolleranze", status: "✅ Completata" },
              ].map((c, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 0",
                  borderBottom: i < 3 ? "1px solid #1a2620" : "none",
                  animation: `slideIn 0.3s ${i * 0.08}s both`,
                }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</p>
                    <p style={{ fontSize: 11, color: "#8696a0" }}>{c.topic}</p>
                  </div>
                  <span style={{ fontSize: 11 }}>{c.status}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Chat View */
          <div style={{
            background: "#111a15",
            borderRadius: 16,
            border: "1px solid #1a2620",
            overflow: "hidden",
            animation: "fadeUp 0.4s both",
          }}>
            {/* Chat Header */}
            <div style={{
              padding: "14px 20px",
              background: "#0d1410",
              borderBottom: "1px solid #1a2620",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: "50%",
                background: "linear-gradient(135deg, #25D366, #128C7E)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, fontWeight: 700,
              }}>👤</div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600 }}>Anteprima Chat WhatsApp</p>
                <p style={{ fontSize: 11, color: "#25D366" }}>Simulazione — Trattoria da Mario</p>
              </div>
            </div>

            {/* Messages */}
            <div style={{
              height: 420,
              overflowY: "auto",
              padding: "16px 20px",
              backgroundImage: "radial-gradient(circle at 20% 80%, rgba(37,211,102,.03) 0%, transparent 50%)",
            }}>
              {messages.map((msg, i) => (
                <div key={msg.id} style={{
                  display: "flex",
                  justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
                  marginBottom: 8,
                  animation: `fadeUp 0.3s ${i > INITIAL_MESSAGES.length - 1 ? "0s" : `${i * 0.06}s`} both`,
                }}>
                  <div style={{
                    maxWidth: "75%",
                    padding: "10px 14px",
                    borderRadius: msg.sender === "user"
                      ? "14px 14px 4px 14px"
                      : "14px 14px 14px 4px",
                    background: msg.sender === "user"
                      ? "#1a3a28"
                      : "#1a2220",
                    border: `1px solid ${msg.sender === "user" ? "#25503a" : "#242e28"}`,
                    position: "relative",
                  }}>
                    <p style={{
                      fontSize: 13.5,
                      lineHeight: 1.45,
                      whiteSpace: "pre-wrap",
                      color: "#e9edef",
                    }}>{msg.text}</p>
                    <p style={{
                      fontSize: 10,
                      color: "#5a6a62",
                      textAlign: "right",
                      marginTop: 4,
                    }}>
                      {msg.time}
                      {msg.sender === "ai" && " · 🤖 RistoAgent"}
                    </p>
                  </div>
                </div>
              ))}

              {typing && (
                <div style={{
                  display: "flex", justifyContent: "flex-start", marginBottom: 8,
                  animation: "fadeUp 0.2s both",
                }}>
                  <div style={{
                    padding: "14px 20px",
                    borderRadius: "14px 14px 14px 4px",
                    background: "#1a2220",
                    border: "1px solid #242e28",
                    display: "flex", gap: 5,
                  }}>
                    {[0, 1, 2].map(j => (
                      <div key={j} style={{
                        width: 7, height: 7, borderRadius: "50%",
                        background: "#25D366",
                        animation: `pulse 1.4s ${j * 0.16}s infinite`,
                      }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div style={{
              padding: "12px 16px",
              borderTop: "1px solid #1a2620",
              background: "#0d1410",
              display: "flex", gap: 10,
            }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Scrivi un messaggio come cliente..."
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: "1px solid #1a2620",
                  background: "#111a15",
                  color: "#e9edef",
                  fontSize: 13.5,
                  fontFamily: "'DM Sans', sans-serif",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = "#25D366"}
                onBlur={e => e.target.style.borderColor = "#1a2620"}
              />
              <button
                onClick={sendMessage}
                style={{
                  width: 46, height: 46, borderRadius: 12, border: "none",
                  background: input.trim() ? "linear-gradient(135deg, #25D366, #128C7E)" : "#1a2620",
                  color: input.trim() ? "#0a0f0d" : "#5a6a62",
                  fontSize: 18, cursor: input.trim() ? "pointer" : "default",
                  transition: "all 0.2s",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >➤</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
