"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { Business, Booking, Conversation, Message, Feedback } from "@/types";

export default function Dashboard() {
  const router = useRouter();
  const supabase = getSupabaseBrowser();

  const [activeTab, setActiveTab] = useState<"oggi" | "conversazioni" | "feedback" | "impostazioni">("oggi");
  const [business, setBusiness] = useState<Business | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [convMessages, setConvMessages] = useState<Message[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [todayMsgCount, setTodayMsgCount] = useState(0);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [editingBiz, setEditingBiz] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", services: "", opening_hours: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/auth"); return; }
      setUserId(data.user.id);
      setUserEmail(data.user.email ?? null);
      loadData(data.user.id);
    });
  }, []);

  async function loadData(uid: string) {
    const { data: bizData } = await supabase
      .from("businesses").select("*").eq("user_id", uid).single();
    if (!bizData) { router.push("/onboarding"); return; }
    const biz = bizData as Business;
    setBusiness(biz);
    setEditForm({ name: biz.name ?? "", services: biz.services ?? "", opening_hours: biz.opening_hours ?? "" });

    // Trial check
    if (biz.plan === "trial" && biz.trial_started_at) {
      const started = new Date(biz.trial_started_at).getTime();
      const now = Date.now();
      const daysElapsed = Math.floor((now - started) / (1000 * 60 * 60 * 24));
      const daysLeft = 15 - daysElapsed;
      if (daysLeft <= 0) {
        router.push("/upgrade?expired=1");
        return;
      }
      setTrialDaysLeft(daysLeft);
    }

    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Rome" });
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

    const { data: fbs } = await supabase
      .from("feedbacks")
      .select("*, conversations(customer_name)")
      .eq("business_id", biz.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setFeedbacks((fbs ?? []) as Feedback[]);

    if (biz.telegram_bot_username) {
      const res = await fetch(`/api/qrcode?username=${biz.telegram_bot_username}`, {
        headers: { "x-user-id": uid },
      });
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

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setUploadLoading(true);
    setUploadMsg(null);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/business/upload", {
      method: "POST",
      headers: { "x-user-id": userId },
      body: fd,
    });
    const json = await res.json();
    if (res.ok) {
      setUploadMsg({ text: `File caricato (${json.characters} caratteri estratti). Il bot ora utilizzerà queste informazioni.`, ok: true });
      setBusiness((b) => b ? { ...b, custom_info: "loaded" } : b);
    } else {
      setUploadMsg({ text: json.error ?? "Errore caricamento", ok: false });
    }
    setUploadLoading(false);
    e.target.value = "";
  }

  async function handleSaveEditForm() {
    if (!userId) return;
    setEditSaving(true);
    const res = await fetch("/api/business", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-user-id": userId },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      const updated = await res.json();
      setBusiness((b) => b ? { ...b, ...updated } : b);
      setEditingBiz(false);
    }
    setEditSaving(false);
  }

  async function handleRemoveCustomInfo() {
    if (!userId) return;
    setUploadLoading(true);
    setUploadMsg(null);
    const res = await fetch("/api/business/upload", {
      method: "DELETE",
      headers: { "x-user-id": userId },
    });
    if (res.ok) {
      setUploadMsg({ text: "Documento rimosso.", ok: true });
      setBusiness((b) => b ? { ...b, custom_info: null } : b);
    }
    setUploadLoading(false);
  }

  async function handleBroadcast() {
    if (!userId || !broadcastMsg.trim()) return;
    setBroadcastLoading(true);
    setBroadcastResult(null);
    const res = await fetch("/api/telegram/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": userId },
      body: JSON.stringify({ message: broadcastMsg }),
    });
    const json = await res.json();
    if (res.ok) {
      setBroadcastResult(`✓ Messaggio inviato a ${json.sent} cliente${json.sent !== 1 ? "i" : ""}.`);
      setBroadcastMsg("");
    } else {
      setBroadcastResult(`Errore: ${json.error ?? "Invio fallito"}`);
    }
    setBroadcastLoading(false);
  }

  async function downloadCustomInfo() {
    if (!userId) return;
    // Fetch fresh business data to get actual text (custom_info may be "loaded" sentinel in state)
    const { data } = await getSupabaseBrowser().from("businesses").select("custom_info, name").eq("user_id", userId).single();
    if (!data) return;
    const row = data as { custom_info: string | null; name: string | null };
    const text = row.custom_info;
    if (!text || text === "loaded") return;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `procedure-${(row.name ?? "ristoagent").toLowerCase().replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const card: React.CSSProperties = {
    background: "#0f1a12", borderRadius: 16, padding: 24, border: "1px solid #1e3022",
  };

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at top, #0f1f2e 0%, #0a0f0d 60%)",
      fontFamily: "'DM Sans','Segoe UI',sans-serif", color: "#e8f0e9", zoom: 1.4 }}>

      {trialDaysLeft !== null && (
        <div style={{ background: trialDaysLeft <= 3 ? "rgba(255,107,107,0.08)" : "rgba(14,165,233,0.08)",
          borderBottom: `1px solid ${trialDaysLeft <= 3 ? "#ff6b6b" : "#0EA5E9"}`,
          padding: "10px 24px", display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <p style={{ fontSize: 13, color: trialDaysLeft <= 3 ? "#ff6b6b" : "#0EA5E9", margin: 0 }}>
            {trialDaysLeft <= 3
              ? `⚠️ La tua prova gratuita scade tra ${trialDaysLeft} giorn${trialDaysLeft === 1 ? "o" : "i"}.`
              : `✨ Prova gratuita — ${trialDaysLeft} giorni rimanenti.`}
          </p>
          <a href="/upgrade" style={{ fontSize: 12, fontWeight: 600, color: "#0a0f0d",
            background: "#0EA5E9", borderRadius: 999, padding: "5px 14px",
            textDecoration: "none", whiteSpace: "nowrap" }}>
            Scegli un piano →
          </a>
        </div>
      )}

      <header style={{ padding: "16px 24px", display: "flex", alignItems: "center",
        justifyContent: "space-between", borderBottom: "1px solid #1e3022",
        background: "rgba(10,15,13,0.8)", backdropFilter: "blur(8px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/logo.png" alt="RistoAgent" style={{ height: 36, width: "auto", }} />
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

      <div style={{ padding: "16px 24px 0", borderBottom: "1px solid #1e3022",
        display: "flex", gap: 4 }}>
        {([
          { id: "oggi", label: "📅 Oggi" },
          { id: "conversazioni", label: "💬 Conversazioni" },
          { id: "feedback", label: "⭐ Feedback" },
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

        {activeTab === "feedback" && (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: "#9ab8a0" }}>
                Feedback clienti
              </h3>
              <p style={{ fontSize: 12, color: "#5a6a62", marginBottom: 20, lineHeight: 1.5 }}>
                Dopo ogni prenotazione il bot chiede automaticamente un feedback al cliente. Eccoli tutti.
              </p>
              {feedbacks.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2.5rem", color: "#5a6a62" }}>
                  <p style={{ fontSize: "1.8rem", marginBottom: 8 }}>⭐</p>
                  <p>Nessun feedback ricevuto ancora.</p>
                  <p style={{ fontSize: "0.82rem", marginTop: 4 }}>
                    Il bot chiederà un feedback 2 ore dopo ogni prenotazione.
                  </p>
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", gap: 24, marginBottom: 20, flexWrap: "wrap" }}>
                    {(() => {
                      const rated = feedbacks.filter(f => f.rating !== null);
                      const avg = rated.length ? (rated.reduce((s, f) => s + (f.rating ?? 0), 0) / rated.length).toFixed(1) : null;
                      return (
                        <>
                          <div style={{ ...card, padding: "16px 24px", flex: "1 1 120px", textAlign: "center" }}>
                            <p style={{ fontSize: 32, fontWeight: 700, fontFamily: "monospace" }}>{feedbacks.length}</p>
                            <p style={{ fontSize: 12, color: "#8696a0" }}>Feedback totali</p>
                          </div>
                          {avg && (
                            <div style={{ ...card, padding: "16px 24px", flex: "1 1 120px", textAlign: "center" }}>
                              <p style={{ fontSize: 32, fontWeight: 700, fontFamily: "monospace" }}>{avg} ⭐</p>
                              <p style={{ fontSize: 12, color: "#8696a0" }}>Media voto</p>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  {feedbacks.map((f) => (
                    <div key={f.id} style={{ padding: "14px 0", borderBottom: "1px solid #1a2620", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                          {f.conversations?.customer_name ?? "Cliente"}
                        </p>
                        {f.comment && (
                          <p style={{ fontSize: 13, color: "#9ab8a0", lineHeight: 1.5 }}>&ldquo;{f.comment}&rdquo;</p>
                        )}
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        {f.rating && (
                          <p style={{ fontSize: 20 }}>{"⭐".repeat(f.rating)}</p>
                        )}
                        <p style={{ fontSize: 11, color: "#5a6a62", marginTop: 4 }}>
                          {new Date(f.created_at).toLocaleDateString("it-IT")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: "#9ab8a0" }}>
                Invia promozione ai clienti
              </h3>
              <p style={{ fontSize: 12, color: "#5a6a62", marginBottom: 16, lineHeight: 1.5 }}>
                Scrivi un messaggio e invialo via Telegram a tutti i clienti che hanno interagito con il bot.
              </p>
              <textarea
                value={broadcastMsg}
                onChange={(e) => setBroadcastMsg(e.target.value)}
                placeholder={"Ciao! 🎉 Questo weekend -15% su tutto il menù degustazione.\nPrenota ora: https://t.me/tuobot"}
                rows={4}
                style={{ width: "100%", padding: "10px 14px", background: "#131a14",
                  border: "1px solid #1e3022", borderRadius: 10, color: "#e8f0e9",
                  fontSize: 13, fontFamily: "inherit", outline: "none",
                  boxSizing: "border-box", resize: "vertical", lineHeight: 1.5 }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
                <button
                  onClick={handleBroadcast}
                  disabled={broadcastLoading || !broadcastMsg.trim()}
                  style={{ padding: "8px 20px", background: "#22c55e", border: "none",
                    borderRadius: 999, color: "#0a0f0d", fontSize: 13, fontWeight: 700,
                    fontFamily: "inherit", cursor: broadcastLoading || !broadcastMsg.trim() ? "not-allowed" : "pointer",
                    opacity: broadcastLoading || !broadcastMsg.trim() ? 0.5 : 1 }}>
                  {broadcastLoading ? "Invio in corso..." : "📣 Invia a tutti i clienti"}
                </button>
                {broadcastResult && (
                  <p style={{ fontSize: 12, color: broadcastResult.startsWith("✓") ? "#4ade80" : "#ff6b6b" }}>
                    {broadcastResult}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "impostazioni" && business && (
          <div style={{ display: "grid", gap: 16 }}>

            {/* Account */}
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "#9ab8a0" }}>Account</h3>
                {!editingBiz ? (
                  <button onClick={() => setEditingBiz(true)} style={{
                    background: "transparent", border: "1px solid #1e3022", borderRadius: 8,
                    color: "#7a9b7e", fontSize: 12, padding: "5px 12px", cursor: "pointer", fontFamily: "inherit",
                  }}>✏️ Modifica attività</button>
                ) : (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setEditingBiz(false)} style={{
                      background: "transparent", border: "1px solid #1e3022", borderRadius: 8,
                      color: "#7a9b7e", fontSize: 12, padding: "5px 12px", cursor: "pointer", fontFamily: "inherit",
                    }}>Annulla</button>
                    <button onClick={handleSaveEditForm} disabled={editSaving} style={{
                      background: "#0EA5E9", border: "none", borderRadius: 8,
                      color: "#fff", fontSize: 12, padding: "5px 14px", cursor: "pointer", fontFamily: "inherit",
                      opacity: editSaving ? 0.6 : 1,
                    }}>{editSaving ? "Salvo..." : "Salva"}</button>
                  </div>
                )}
              </div>
              <div style={{ display: "grid", gap: 12 }}>
                <div>
                  <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", color: "#7a9b7e", marginBottom: 4 }}>Email account</p>
                  <p style={{ fontSize: 14, color: "#e8f0e9" }}>{userEmail ?? "—"}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", color: "#7a9b7e", marginBottom: 4 }}>Nome attività</p>
                  {editingBiz ? (
                    <input value={editForm.name} onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                      style={{ width: "100%", padding: "8px 12px", background: "#131a14", border: "1px solid #1e3022",
                        borderRadius: 8, color: "#e8f0e9", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                  ) : (
                    <p style={{ fontSize: 14, color: "#e8f0e9" }}>{business.name}</p>
                  )}
                </div>
                <div>
                  <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", color: "#7a9b7e", marginBottom: 4 }}>Servizi e informazioni</p>
                  {editingBiz ? (
                    <textarea value={editForm.services} onChange={(e) => setEditForm(f => ({ ...f, services: e.target.value }))}
                      rows={4} style={{ width: "100%", padding: "8px 12px", background: "#131a14", border: "1px solid #1e3022",
                        borderRadius: 8, color: "#e8f0e9", fontSize: 13, fontFamily: "inherit", outline: "none",
                        boxSizing: "border-box", resize: "vertical" }} />
                  ) : (
                    <p style={{ fontSize: 13, color: "#9ab8a0", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{business.services ?? "—"}</p>
                  )}
                </div>
                <div>
                  <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", color: "#7a9b7e", marginBottom: 4 }}>Orari</p>
                  {editingBiz ? (
                    <textarea value={editForm.opening_hours} onChange={(e) => setEditForm(f => ({ ...f, opening_hours: e.target.value }))}
                      rows={2} style={{ width: "100%", padding: "8px 12px", background: "#131a14", border: "1px solid #1e3022",
                        borderRadius: 8, color: "#e8f0e9", fontSize: 13, fontFamily: "inherit", outline: "none",
                        boxSizing: "border-box", resize: "vertical" }} />
                  ) : (
                    <p style={{ fontSize: 13, color: "#9ab8a0" }}>{business.opening_hours ?? "—"}</p>
                  )}
                </div>
              </div>
            </div>

            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: "#9ab8a0" }}>
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
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: "#8696a0" }}>
                Informazioni aggiuntive per il bot
              </h3>
              <p style={{ fontSize: 12, color: "#5a6a62", marginBottom: 16, lineHeight: 1.5 }}>
                Carica un file con il menu, i prezzi, le offerte speciali o qualsiasi altra informazione utile.
                Più dettagli fornisci, più preciso sarà il bot nel rispondere ai clienti.
                Formati supportati: PDF, Word (.docx), Excel (.xlsx), TXT — max 5 MB.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <label style={{ cursor: uploadLoading ? "not-allowed" : "pointer" }}>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                    style={{ display: "none" }}
                    disabled={uploadLoading}
                    onChange={handleFileUpload}
                  />
                  <span style={{
                    padding: "8px 18px", background: "#0EA5E9", color: "#fff",
                    borderRadius: 999, fontSize: 13, fontWeight: 600,
                    opacity: uploadLoading ? 0.5 : 1,
                  }}>
                    {uploadLoading ? "Caricamento..." : "📎 Carica file"}
                  </span>
                </label>
                {business.custom_info && !uploadLoading && (
                  <button onClick={handleRemoveCustomInfo} style={{
                    background: "transparent", border: "1px solid #3a2020",
                    borderRadius: 8, color: "#ff6b6b", fontSize: 12,
                    padding: "6px 12px", cursor: "pointer", fontFamily: "inherit",
                  }}>
                    Rimuovi documento
                  </button>
                )}
                {business.custom_info && (
                  <span style={{ fontSize: 12, color: "#4ade80" }}>✓ Documento caricato</span>
                )}
                {business.custom_info && (
                  <button onClick={downloadCustomInfo} style={{
                    background: "transparent", border: "1px solid #1e3022",
                    borderRadius: 8, color: "#9ab8a0", fontSize: 12,
                    padding: "6px 12px", cursor: "pointer", fontFamily: "inherit",
                  }}>
                    ⬇ Scarica procedure
                  </button>
                )}
              </div>
              {uploadMsg && (
                <p style={{ fontSize: 12, marginTop: 10,
                  color: uploadMsg.ok ? "#4ade80" : "#ff6b6b" }}>
                  {uploadMsg.text}
                </p>
              )}
            </div>

            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: "#8696a0" }}>
                Piano attivo
              </h3>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <span style={{ fontSize: 13, padding: "6px 14px", borderRadius: 6, fontWeight: 600,
                  background: business.plan === "pro" ? "rgba(14,165,233,0.15)"
                    : business.plan === "starter" ? "rgba(74,222,128,0.1)"
                    : business.plan === "flexible" ? "rgba(251,191,36,0.1)"
                    : "rgba(255,255,255,0.05)",
                  color: business.plan === "pro" ? "#0EA5E9"
                    : business.plan === "starter" ? "#4ade80"
                    : business.plan === "flexible" ? "#fbbf24"
                    : "#8696a0" }}>
                  {business.plan === "pro" ? "⭐ Pro"
                    : business.plan === "starter" ? "Starter"
                    : business.plan === "flexible" ? "Flessibile"
                    : "Prova gratuita"}
                </span>
                {business.plan !== "trial" ? (
                  <button
                    onClick={async () => {
                      if (!userId) return;
                      const res = await fetch("/api/stripe/portal", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId }),
                      });
                      const json = await res.json();
                      if (json.url) window.location.href = json.url;
                      else alert(json.error ?? "Errore");
                    }}
                    style={{ fontSize: 12, padding: "6px 14px", background: "transparent",
                      border: "1px solid #1a2620", borderRadius: 8, color: "#8696a0",
                      cursor: "pointer", fontFamily: "inherit" }}>
                    Gestisci abbonamento
                  </button>
                ) : (
                  <a href="/upgrade" style={{ fontSize: 12, padding: "6px 14px", background: "transparent",
                    border: "1px solid #0EA5E9", borderRadius: 8, color: "#0EA5E9",
                    textDecoration: "none" }}>
                    Scegli un piano →
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
