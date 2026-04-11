"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { Business, Booking, Conversation, Message } from "@/types";

export default function Dashboard() {
  const router = useRouter();
  const supabase = getSupabaseBrowser();

  const [activeTab, setActiveTab] = useState<"oggi" | "conversazioni" | "impostazioni">("oggi");
  const [business, setBusiness] = useState<Business | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [convMessages, setConvMessages] = useState<Message[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [todayMsgCount, setTodayMsgCount] = useState(0);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/auth"); return; }
      setUserId(data.user.id);
      loadData(data.user.id);
    });
  }, []);

  async function loadData(uid: string) {
    const { data: biz } = await supabase
      .from("businesses").select("*").eq("user_id", uid).single();
    if (!biz) { router.push("/onboarding"); return; }
    setBusiness(biz as Business);

    const today = new Date().toISOString().split("T")[0];
    const { data: bks } = await supabase
      .from("bookings").select("*").eq("business_id", biz.id).eq("date", today)
      .order("time", { ascending: true });
    setBookings((bks ?? []) as Booking[]);

    const { data: convs } = await supabase
      .from("conversations").select("*").eq("business_id", biz.id)
      .order("last_message_at", { ascending: false }).limit(20);
    setConversations((convs ?? []) as Conversation[]);

    const { count } = await supabase.from("messages")
      .select("*", { count: "exact", head: true })
      .gte("created_at", `${today}T00:00:00`);
    setTodayMsgCount(count ?? 0);

    if (biz.telegram_bot_username) {
      const res = await fetch(`/api/qrcode?username=${biz.telegram_bot_username}`);
      if (res.ok) {
        const blob = await res.blob();
        setQrDataUrl(URL.createObjectURL(blob));
      }
    }
  }

  async function loadConversationMessages(convId: string) {
    setSelectedConv(convId);
    const { data } = await supabase.from("messages").select("*")
      .eq("conversation_id", convId).order("created_at", { ascending: true });
    setConvMessages((data ?? []) as Message[]);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/auth");
  }

  function downloadQR() {
    if (!qrDataUrl || !business?.telegram_bot_username) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `ristoagent-qr-${business.telegram_bot_username}.png`;
    a.click();
  }

  const card: React.CSSProperties = {
    background: "#111a15", borderRadius: 16, padding: 24, border: "1px solid #1a2620",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f0d",
      fontFamily: "'DM Sans','Segoe UI',sans-serif", color: "#e9edef" }}>

      <header style={{ padding: "16px 24px", display: "flex", alignItems: "center",
        justifyContent: "space-between", borderBottom: "1px solid #1a2620",
        background: "#0d1410" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: "#0EA5E9" }}>RistoAgent</span>
          {business && (
            <span style={{ fontSize: 13, color: "#8696a0" }}>— {business.name}</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, color: "#0EA5E9" }}>● Attivo</span>
          <button onClick={handleSignOut} style={{ background: "transparent",
            border: "1px solid #1a2620", borderRadius: 8, color: "#8696a0",
            fontSize: 12, padding: "6px 12px", cursor: "pointer", fontFamily: "inherit" }}>
            Esci
          </button>
        </div>
      </header>

      <div style={{ padding: "16px 24px 0", borderBottom: "1px solid #1a2620",
        display: "flex", gap: 4 }}>
        {([
          { id: "oggi", label: "📅 Oggi" },
          { id: "conversazioni", label: "💬 Conversazioni" },
          { id: "impostazioni", label: "⚙️ Impostazioni" },
        ] as const).map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: "10px 20px", background: "transparent", border: "none",
            borderBottom: `2px solid ${activeTab === tab.id ? "#0EA5E9" : "transparent"}`,
            color: activeTab === tab.id ? "#0EA5E9" : "#8696a0",
            fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px" }}>

        {activeTab === "oggi" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
              gap: 14, marginBottom: 24 }}>
              {[
                { label: "Messaggi oggi", value: todayMsgCount.toString(), icon: "💬" },
                { label: "Prenotazioni oggi", value: bookings.length.toString(), icon: "📅" },
              ].map((m) => (
                <div key={m.label} style={card}>
                  <span style={{ fontSize: 24 }}>{m.icon}</span>
                  <p style={{ fontSize: 36, fontWeight: 700, marginTop: 8,
                    fontFamily: "monospace" }}>{m.value}</p>
                  <p style={{ fontSize: 13, color: "#8696a0", marginTop: 2 }}>{m.label}</p>
                </div>
              ))}
            </div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: "#8696a0" }}>
                Prenotazioni di oggi
              </h3>
              {bookings.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "#5a6a62" }}>
                  <p style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>📭</p>
                  <p>Nessuna prenotazione per oggi.</p>
                  <p style={{ fontSize: "0.82rem", marginTop: "0.3rem" }}>
                    Condividi il tuo QR code per iniziare a ricevere prenotazioni!
                  </p>
                </div>
              ) : (
                bookings.map((b) => (
                  <div key={b.id} style={{ display: "flex", justifyContent: "space-between",
                    alignItems: "center", padding: "12px 0", borderBottom: "1px solid #1a2620" }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600 }}>{b.customer_name}</p>
                      <p style={{ fontSize: 12, color: "#8696a0" }}>{b.party_size} persone</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: 14, fontWeight: 600 }}>{b.time.slice(0, 5)}</p>
                      <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6,
                        background: "rgba(14,165,233,0.1)", color: "#0EA5E9",
                        fontWeight: 600 }}>{b.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "conversazioni" && (
          <div style={{ display: "grid",
            gridTemplateColumns: selectedConv ? "1fr 1.5fr" : "1fr", gap: 16 }}>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: "#8696a0" }}>
                Conversazioni recenti
              </h3>
              {conversations.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "#5a6a62" }}>
                  <p>Nessuna conversazione ancora.</p>
                  <p style={{ fontSize: "0.82rem", marginTop: "0.3rem" }}>
                    I clienti che scriveranno al bot appariranno qui.
                  </p>
                </div>
              ) : (
                conversations.map((c) => (
                  <div key={c.id} onClick={() => loadConversationMessages(c.id)}
                    style={{ padding: "12px 0", borderBottom: "1px solid #1a2620",
                      cursor: "pointer",
                      paddingLeft: selectedConv === c.id ? 8 : 0,
                      background: selectedConv === c.id ? "rgba(14,165,233,0.05)" : "transparent",
                      borderRadius: 8, transition: "all 0.2s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <p style={{ fontSize: 14, fontWeight: 600 }}>{c.customer_name}</p>
                      <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6,
                        background: c.language === "it" ? "rgba(14,165,233,0.1)" : "rgba(255,200,0,0.1)",
                        color: c.language === "it" ? "#0EA5E9" : "#ffc800",
                        fontWeight: 600 }}>{c.language.toUpperCase()}</span>
                    </div>
                    <p style={{ fontSize: 11, color: "#5a6a62", marginTop: 2 }}>
                      {new Date(c.last_message_at).toLocaleString("it-IT")}
                    </p>
                  </div>
                ))
              )}
            </div>
            {selectedConv && (
              <div style={{ ...card, display: "flex", flexDirection: "column" }}>
                <div style={{ overflowY: "auto", maxHeight: 500 }}>
                  {convMessages.map((m) => (
                    <div key={m.id} style={{ display: "flex",
                      justifyContent: m.sender === "customer" ? "flex-end" : "flex-start",
                      marginBottom: 8 }}>
                      <div style={{ maxWidth: "75%", padding: "10px 14px",
                        borderRadius: m.sender === "customer"
                          ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                        background: m.sender === "customer" ? "#1a3a28" : "#1a2220",
                        border: `1px solid ${m.sender === "customer" ? "#254a38" : "#242e28"}` }}>
                        <p style={{ fontSize: 13, lineHeight: 1.45, whiteSpace: "pre-wrap" }}>
                          {m.text}
                        </p>
                        <p style={{ fontSize: 10, color: "#5a6a62", textAlign: "right", marginTop: 4 }}>
                          {new Date(m.created_at).toLocaleTimeString("it-IT",
                            { hour: "2-digit", minute: "2-digit" })}
                          {m.sender === "ai" && " · 🤖"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "impostazioni" && business && (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: "#8696a0" }}>
                Bot Telegram
              </h3>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600 }}>
                    {business.telegram_bot_username ? `@${business.telegram_bot_username}` : "Non configurato"}
                  </p>
                  {business.telegram_bot_username && (
                    <a href={`https://t.me/${business.telegram_bot_username}`}
                      target="_blank" rel="noreferrer"
                      style={{ fontSize: 12, color: "#0EA5E9" }}>
                      t.me/{business.telegram_bot_username} ↗
                    </a>
                  )}
                </div>
                {business.telegram_bot_username && (
                  <button onClick={() => navigator.clipboard.writeText(
                    `https://t.me/${business.telegram_bot_username}`
                  )} style={{ background: "transparent", border: "1px solid #1a2620",
                    borderRadius: 8, color: "#8696a0", fontSize: 12,
                    padding: "6px 12px", cursor: "pointer", fontFamily: "inherit" }}>
                    📋 Copia link
                  </button>
                )}
              </div>
            </div>

            {qrDataUrl && (
              <div style={card}>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: "#8696a0" }}>
                  QR Code
                </h3>
                <p style={{ fontSize: 12, color: "#5a6a62", marginBottom: 16 }}>
                  Scarica e usa su volantini, social, menu, vetrina — i clienti lo scansionano
                  e aprono direttamente il bot Telegram.
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                  <img src={qrDataUrl} alt="QR Code"
                    style={{ width: 120, height: 120, borderRadius: 8, background: "#fff", padding: 4 }} />
                  <button onClick={downloadQR} style={{
                    padding: "0.75rem 1.5rem", background: "#0EA5E9", color: "#fff",
                    border: "none", borderRadius: "999px", fontSize: "0.9rem",
                    fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
                  }}>
                    ⬇ Scarica PNG
                  </button>
                </div>
              </div>
            )}

            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: "#8696a0" }}>
                Google Calendar
              </h3>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, fontWeight: 600,
                  background: business.google_access_token ? "rgba(14,165,233,0.1)" : "rgba(255,107,107,0.1)",
                  color: business.google_access_token ? "#0EA5E9" : "#ff6b6b" }}>
                  {business.google_access_token ? "✓ Collegato" : "Non collegato"}
                </span>
                <a href={`/api/google/auth?userId=${userId}`} style={{
                  padding: "6px 16px", background: "transparent",
                  border: "1px solid #1a2620", borderRadius: 8, color: "#8696a0",
                  fontSize: 12, textDecoration: "none" }}>
                  {business.google_access_token ? "Ricollegare" : "Collega"}
                </a>
              </div>
            </div>

            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: "#8696a0" }}>
                Piano attivo
              </h3>
              <span style={{ fontSize: 13, padding: "6px 14px", borderRadius: 6, fontWeight: 600,
                background: business.plan === "pro" ? "rgba(14,165,233,0.15)" : "rgba(255,255,255,0.05)",
                color: business.plan === "pro" ? "#0EA5E9" : "#8696a0" }}>
                {business.plan === "pro" ? "⭐ Pro" : "Starter (gratuito)"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
