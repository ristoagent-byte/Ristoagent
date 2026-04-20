"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

const SENTINEL_IT = "Non ho informazioni su questo";
const SENTINEL_EN = "I don't have information on this";

type Msg = {
  role: "user" | "assistant";
  content: string;
  isForwardPrompt?: boolean;
};

export default function SupportChat() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [callout, setCallout] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content: "Ciao! 👋 Sono RistoAgent AI, un assistente virtuale. Sono qui per aiutarti nella creazione del tuo profilo e posso rispondere a qualsiasi tua domanda in merito al servizio di RistoAgent.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [forwardEmail, setForwardEmail] = useState("");
  const [forwardLoading, setForwardLoading] = useState(false);
  const [forwardSent, setForwardSent] = useState(false);
  const [pendingForwardMessage, setPendingForwardMessage] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Get logged-in user email if available
  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setUserEmail(data.user.email);
    });
  }, []);

  // Mostra callout dopo 5s, una volta per sessione
  useEffect(() => {
    if (typeof sessionStorage === "undefined") return;
    if (sessionStorage.getItem("chatAutoOpened")) return;
    const t = setTimeout(() => {
      setCallout(true);
      sessionStorage.setItem("chatAutoOpened", "1");
    }, 5000);
    return () => clearTimeout(t);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Hide on dashboard — logged-in users have support via email directly
  if (pathname?.startsWith("/dashboard")) return null;

  async function openWithQuestion() {
    setCallout(false);
    setOpen(true);
    // Simula la domanda dell'utente sulla procedura di iscrizione
    const question = "Potresti spiegarmi la procedura di iscrizione passo per passo?";
    setInput(question);
    setTimeout(() => {
      setInput("");
      const userMsg: Msg = { role: "user", content: question };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      const history = [{ role: "assistant" as const, content: messages[0].content }];
      fetch("/api/chat/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question, history }),
      }).then(async (res) => {
        if (!res.body) return;
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const line of decoder.decode(value).split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.delta) {
                fullText += parsed.delta;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: "assistant", content: fullText };
                  return updated;
                });
              }
            } catch { /* ignore */ }
          }
        }
        setLoading(false);
      }).catch(() => setLoading(false));
    }, 100);
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setForwardSent(false);

    const userMsg: Msg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    const history = newMessages.slice(-7, -1).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await fetch("/api/chat/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });

      if (!res.body) throw new Error("No stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      const assistantMsg: Msg = { role: "assistant", content: "" };
      setMessages((prev) => [...prev, assistantMsg]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value).split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.delta) {
              fullText += parsed.delta;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: fullText };
                return updated;
              });
            }
          } catch { /* ignore parse errors */ }
        }
      }

      // Check if bot doesn't know — show forward option
      const cantAnswer =
        fullText.includes(SENTINEL_IT) || fullText.includes(SENTINEL_EN);
      if (cantAnswer) {
        setPendingForwardMessage(text);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "__forward__", isForwardPrompt: true },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Errore di connessione. Riprova tra un momento." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleForward() {
    const email = userEmail ?? forwardEmail.trim();
    if (!email || !pendingForwardMessage) return;
    setForwardLoading(true);

    await fetch("/api/chat/support/forward", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        message: pendingForwardMessage,
        botReply: messages.findLast((m) => m.role === "assistant" && !m.isForwardPrompt)?.content,
      }),
    });

    setForwardLoading(false);
    setForwardSent(true);
    setPendingForwardMessage(null);
    setMessages((prev) =>
      prev.map((m) =>
        m.isForwardPrompt
          ? { role: "assistant", content: "✅ Messaggio inviato! Ti risponderemo entro 24 ore." }
          : m
      )
    );
  }

  const s = {
    bubble: {
      position: "fixed" as const,
      bottom: 28,
      right: 28,
      width: 72,
      height: 72,
      borderRadius: "50%",
      background: "linear-gradient(135deg, #22c55e, #16a34a)",
      border: "none",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "1.8rem",
      boxShadow: "0 6px 32px rgba(34,197,94,0.5)",
      zIndex: 9999,
      transition: "transform 0.2s, box-shadow 0.2s",
    },
    window: {
      position: "fixed" as const,
      bottom: 114,
      right: 28,
      width: "min(420px, calc(100vw - 56px))",
      height: "min(560px, calc(100vh - 160px))",
      background: "#0a1209",
      border: "1px solid #1a3020",
      borderRadius: "1.4rem",
      display: "flex",
      flexDirection: "column" as const,
      zIndex: 9999,
      boxShadow: "0 28px 90px rgba(0,0,0,0.7)",
      fontFamily: "'DM Sans','Segoe UI',sans-serif",
      overflow: "hidden",
    },
  };

  return (
    <>
      {/* Callout proattivo */}
      {callout && !open && (
        <div style={{
          position: "fixed", bottom: 112, right: 28, zIndex: 9999,
          display: "flex", alignItems: "flex-end", gap: 10,
          animation: "slideUp 0.3s ease",
        }}>
          <div
            onClick={openWithQuestion}
            style={{
              background: "#0f1610", border: "1px solid #1a3020",
              borderRadius: "12px 12px 4px 12px", padding: "10px 14px",
              color: "#e8f0e9", fontSize: 13, lineHeight: 1.5, maxWidth: 220,
              cursor: "pointer", boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}
          >
            Ti interessa sapere come attivare il tuo bot <strong>gratuitamente</strong>, passo dopo passo? 👇
            <button onClick={(e) => { e.stopPropagation(); setCallout(false); }} style={{
              float: "right", background: "transparent", border: "none",
              color: "#5a6a62", fontSize: 14, cursor: "pointer", marginLeft: 6, lineHeight: 1,
            }}>×</button>
          </div>
        </div>
      )}

      {/* Bubble */}
      <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
        {!open && (
          <span style={{
            fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.06em",
            textTransform: "uppercase", color: "#4ade80",
            background: "rgba(10,18,9,0.85)", border: "1px solid #1a3020",
            padding: "2px 7px", borderRadius: 999, whiteSpace: "nowrap",
          }}>Supporto</span>
        )}
        <button
          onClick={() => { setCallout(false); setOpen((o) => !o); }}
          style={{ ...s.bubble, position: "relative", bottom: "auto", right: "auto", zIndex: "auto" }}
          aria-label="Apri chat supporto RistoAgent"
        >
          {open ? "✕" : "💬"}
        </button>
      </div>

      {/* Chat window */}
      {open && (
        <div style={s.window}>
          {/* Header */}
          <div style={{
            padding: "1rem 1.2rem",
            borderBottom: "1px solid #1e2b20",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.9rem",
            }}>🤖</div>
            <div>
              <p style={{ fontSize: "0.88rem", fontWeight: 600, color: "#e8f0e9", margin: 0 }}>
                Assistente RistoAgent
              </p>
              <p style={{ fontSize: "0.72rem", color: "#4ade80", margin: 0 }}>● online</p>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}>
            {messages.map((m, i) => (
              <div key={i}>
                {m.isForwardPrompt ? (
                  // Forward prompt UI
                  <div style={{
                    background: "#131a14",
                    border: "1px solid #1e2b20",
                    borderRadius: "0.8rem",
                    padding: "0.8rem",
                  }}>
                    {forwardSent ? (
                      <p style={{ color: "#4ade80", fontSize: "0.84rem", margin: 0 }}>
                        ✅ Messaggio inviato! Ti risponderemo entro 24 ore.
                      </p>
                    ) : (
                      <>
                        <p style={{ color: "#7a9b7e", fontSize: "0.82rem", marginBottom: "0.6rem" }}>
                          Vuoi che inoltriamo la tua domanda al team?
                        </p>
                        {!userEmail && (
                          <input
                            type="email"
                            placeholder="La tua email"
                            value={forwardEmail}
                            onChange={(e) => setForwardEmail(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "0.5rem 0.75rem",
                              background: "#0a0f0d",
                              border: "1px solid #1e2b20",
                              borderRadius: "0.5rem",
                              color: "#e8f0e9",
                              fontSize: "0.82rem",
                              fontFamily: "inherit",
                              marginBottom: "0.5rem",
                              boxSizing: "border-box" as const,
                              outline: "none",
                            }}
                          />
                        )}
                        {userEmail && (
                          <p style={{ color: "#7a9b7e", fontSize: "0.78rem", marginBottom: "0.5rem" }}>
                            Risponderemo a: {userEmail}
                          </p>
                        )}
                        <button
                          onClick={handleForward}
                          disabled={forwardLoading || (!userEmail && !forwardEmail.trim())}
                          style={{
                            width: "100%",
                            padding: "0.5rem",
                            background: "#16a34a",
                            border: "none",
                            borderRadius: "0.5rem",
                            color: "#fff",
                            fontSize: "0.82rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            opacity: forwardLoading ? 0.6 : 1,
                          }}
                        >
                          {forwardLoading ? "Invio..." : "Sì, invia al team →"}
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  // Regular message bubble
                  <div style={{
                    display: "flex",
                    justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                  }}>
                    <div style={{
                      maxWidth: "82%",
                      padding: "0.6rem 0.9rem",
                      borderRadius: m.role === "user"
                        ? "1rem 1rem 0.2rem 1rem"
                        : "1rem 1rem 1rem 0.2rem",
                      background: m.role === "user" ? "#16a34a" : "#1a2b1e",
                      color: "#e8f0e9",
                      fontSize: "0.84rem",
                      lineHeight: 1.5,
                      whiteSpace: "pre-wrap",
                    }}>
                      {m.content}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div style={{ display: "flex", gap: "4px", paddingLeft: "4px" }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{
                    width: 7, height: 7, borderRadius: "50%",
                    background: "#16a34a",
                    animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: "0.75rem 1rem",
            borderTop: "1px solid #1e2b20",
            display: "flex",
            gap: "0.5rem",
          }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Scrivi un messaggio..."
              disabled={loading}
              style={{
                flex: 1,
                padding: "0.55rem 0.85rem",
                background: "#131a14",
                border: "1px solid #1e2b20",
                borderRadius: "999px",
                color: "#e8f0e9",
                fontSize: "0.84rem",
                fontFamily: "inherit",
                outline: "none",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                width: 36, height: 36,
                borderRadius: "50%",
                background: input.trim() ? "#16a34a" : "#1e2b20",
                border: "none",
                cursor: input.trim() ? "pointer" : "default",
                color: "#fff",
                fontSize: "0.9rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "background 0.2s",
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

    </>
  );
}
