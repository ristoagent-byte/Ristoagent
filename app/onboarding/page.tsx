"use client";

import { useState, useEffect, Suspense, type CSSProperties } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

/* ── CONSTANTS ─────────────────────────────────────────────── */

const RESTAURANT_TYPES = [
  "Ristorante Italiano", "Pizzeria", "Trattoria / Osteria",
  "Ristorante di Pesce", "Sushi / Asiatico",
  "Fast Food / Street food", "Agriturismo", "Altro",
];

const CUISINE_CHIPS = [
  "Italiana", "Pizza", "Pesce", "Carne", "Vegetariana / Vegana",
  "Sushi", "Fusion", "Regionale", "Altro",
];

const DAYS = [
  { key: "mon", label: "Lunedì" },
  { key: "tue", label: "Martedì" },
  { key: "wed", label: "Mercoledì" },
  { key: "thu", label: "Giovedì" },
  { key: "fri", label: "Venerdì" },
  { key: "sat", label: "Sabato" },
  { key: "sun", label: "Domenica" },
] as const;

const STEP_LABELS = [
  "Bot", "Profilo", "Info bot", "Tavoli", "Orari",
  "Calendario", "Regole", "Attiva",
];

/* ── TYPES ──────────────────────────────────────────────────── */

type HoursMap = Record<string, { lunch?: string; dinner?: string } | null>;

type WizardData = {
  botToken: string; botUsername: string; botName: string;
  name: string; city: string; types: string[]; partitaIva: string;
  cuisine: string[]; allowsDogs: boolean; hasGlutenFree: boolean; hasOutdoor: boolean; notes: string;
  tables: { t2: number; t4: number; t6: number; terrace: boolean };
  hours: HoursMap;
  rules: { durationMin: number; delayMin: number; noticeHours: number };
  calendarConnected: boolean;
};

/* ── UTILS ──────────────────────────────────────────────────── */

function buildServicesText(d: WizardData): string {
  return [
    d.cuisine.length > 0 ? `Cucina: ${d.cuisine.join(", ")}` : null,
    d.allowsDogs ? "Animali ammessi: sì, accettiamo cani" : null,
    d.hasGlutenFree ? "Disponibili opzioni senza glutine" : null,
    d.hasOutdoor ? "Disponibili tavoli all'aperto / terrazza" : null,
    d.notes.trim() || null,
  ].filter(Boolean).join("\n");
}

function serializeHours(hours: HoursMap): string {
  return DAYS.map(({ key, label }) => {
    const h = hours[key];
    if (!h) return `${label}: chiuso`;
    const parts = [
      h.lunch ? `pranzo ${h.lunch}` : null,
      h.dinner ? `cena ${h.dinner}` : null,
    ].filter(Boolean);
    return parts.length ? `${label}: ${parts.join(", ")}` : `${label}: chiuso`;
  }).join("\n");
}

const totalSeats = (t: { t2: number; t4: number; t6: number }) =>
  t.t2 * 2 + t.t4 * 4 + t.t6 * 6;

/* ── SHARED STYLES ──────────────────────────────────────────── */

const inp: CSSProperties = {
  width: "100%", padding: "0.8rem 1rem",
  background: "#131a14", border: "1px solid #2a3f2e",
  borderRadius: "0.6rem", color: "#f0f8f2",
  fontSize: "0.93rem", fontFamily: "inherit",
  outline: "none", boxSizing: "border-box",
};

const lbl: CSSProperties = {
  display: "block", fontSize: "0.72rem",
  textTransform: "uppercase", letterSpacing: "0.07em",
  color: "#a0c0a8", marginBottom: "0.4rem", fontWeight: 600,
};

const warn: CSSProperties = {
  background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.18)",
  borderRadius: "0.5rem", padding: "0.55rem 0.9rem", marginBottom: "1.5rem",
  fontSize: "0.78rem", color: "#f87171",
};

/* ── INITIAL STATE ──────────────────────────────────────────── */

const INITIAL: WizardData = {
  botToken: "", botUsername: "", botName: "",
  name: "", city: "", types: [], partitaIva: "",
  cuisine: [], allowsDogs: false, hasGlutenFree: false, hasOutdoor: false, notes: "",
  tables: { t2: 0, t4: 0, t6: 0, terrace: false },
  hours: {},
  rules: { durationMin: 90, delayMin: 15, noticeHours: 1 },
  calendarConnected: false,
};

/* ── COMPONENT ──────────────────────────────────────────────── */

function OnboardingInner() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = getSupabaseBrowser();

  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>(INITIAL);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [showTablesWarn, setShowTablesWarn] = useState(false);
  const [activated, setActivated] = useState(false);

  /* ── INIT ── */
  useEffect(() => {
    const googleOk = params.get("google") === "connected";
    const errParam = params.get("error");

    // Restore draft
    try {
      const raw = localStorage.getItem("onboarding_draft");
      if (raw) {
        const { data: d, step: s } = JSON.parse(raw) as { data: WizardData; step: number };
        setData({ ...d, calendarConnected: d.calendarConnected || googleOk });
        setStep(s);
      } else if (googleOk) {
        setData(prev => ({ ...prev, calendarConnected: true }));
      }
    } catch { /* ignore parse errors */ }

    if (errParam === "google_denied") setError("Accesso Google negato. Riprova.");
    if (errParam === "google_failed") setError("Errore connessione Google. Riprova.");

    // Auth + existing business
    supabase.auth.getUser().then(async ({ data: auth }) => {
      if (!auth.user) { router.push("/auth"); return; }
      setUserId(auth.user.id);

      const { data: biz } = await supabase
        .from("businesses").select("*")
        .eq("user_id", auth.user.id).single();

      if (!biz) return;
      const b = biz as Record<string, unknown>;
      setBusinessId(b.id as string);

      // Fully completed → dashboard
      if (b.telegram_bot_token && !googleOk && !localStorage.getItem("onboarding_draft")) {
        router.replace("/dashboard");
        return;
      }

      // Pre-populate if no draft
      if (!localStorage.getItem("onboarding_draft")) {
        setData(prev => ({
          ...prev,
          name: (b.name as string) ?? "",
          city: (b.city as string) ?? "",
          types: b.type ? (b.type as string).split(", ") : [],
          partitaIva: (b.partita_iva as string) ?? "",
        }));
      }
    });
  }, []);

  /* ── HELPERS ── */
  function save(d: WizardData, s: number) {
    localStorage.setItem("onboarding_draft", JSON.stringify({ data: d, step: s }));
  }

  function go(d: WizardData, nextS: number) {
    setCompletedSteps(prev => [...new Set([...prev, step])]);
    save(d, nextS);
    setData(d);
    setStep(nextS);
    setError("");
    window.scrollTo(0, 0);
  }

  function back() {
    setStep(s => s - 1);
    setError("");
    window.scrollTo(0, 0);
  }

  /* ── STEP 1: validate bot ── */
  async function validateBot() {
    if (data.botUsername) { go(data, 2); return; } // already validated
    if (!data.botToken.trim()) return;
    setLoading(true); setError("");
    try {
      const res = await fetch(`https://api.telegram.org/bot${data.botToken.trim()}/getMe`);
      const json = await res.json();
      if (!json.ok) throw new Error("invalid");
      const next: WizardData = {
        ...data,
        botToken: data.botToken.trim(),
        botUsername: json.result.username ?? "",
        botName: json.result.first_name ?? "",
      };
      go(next, 2);
    } catch {
      setError("Token non valido. Ricontrolla il token copiato da BotFather.");
    } finally {
      setLoading(false);
    }
  }

  /* ── STEP 2: create/update business ── */
  async function saveProfile() {
    if (!data.name.trim() || !userId) return;
    setLoading(true); setError("");

    // P.IVA anti-abuse check (optional field)
    if (data.partitaIva.trim().length >= 5) {
      const ck = await fetch(
        `/api/business/check-piva?piva=${encodeURIComponent(data.partitaIva.trim().toUpperCase())}&userId=${userId}`
      );
      const ckJson = await ck.json();
      if (ckJson.blocked) {
        setError("La prova gratuita è già stata utilizzata per questa attività.");
        setLoading(false); return;
      }
    }

    const method = businessId ? "PUT" : "POST";
    const res = await fetch("/api/business", {
      method,
      headers: { "Content-Type": "application/json", "x-user-id": userId },
      body: JSON.stringify({
        name: data.name.trim(),
        type: data.types.join(", ") || "Ristorante / Pizzeria",
        partita_iva: data.partitaIva.trim().toUpperCase() || undefined,
      }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error); setLoading(false); return; }
    if (!businessId) setBusinessId(json.id);
    setLoading(false);
    go(data, 3);
  }

  /* ── STEP 6: Google OAuth ── */
  function connectGoogle() {
    save(data, 6);
    window.location.href = `/api/google/auth?userId=${userId}`;
  }

  /* ── STEP 8: activate ── */
  async function activate() {
    if (!userId) return;
    setLoading(true); setError("");

    const res = await fetch("/api/business", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-user-id": userId },
      body: JSON.stringify({
        telegram_bot_token: data.botToken,
        telegram_bot_username: data.botUsername,
        services: buildServicesText(data),
        opening_hours: serializeHours(data.hours),
        opening_hours_structured: Object.keys(data.hours).length > 0 ? data.hours : null,
        tables_2: data.tables.t2,
        tables_4: data.tables.t4,
        tables_6: data.tables.t6,
        has_terrace: data.tables.terrace,
        reservation_duration_min: data.rules.durationMin,
        max_delay_min: data.rules.delayMin,
        min_notice_hours: data.rules.noticeHours,
      }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error); setLoading(false); return; }

    // Generate QR
    if (data.botUsername) {
      try {
        const qr = await fetch(`/api/qrcode?username=${data.botUsername}`, { headers: { "x-user-id": userId } });
        if (qr.ok) setQrDataUrl(URL.createObjectURL(await qr.blob()));
      } catch { /* QR failure is non-blocking */ }
    }

    localStorage.removeItem("onboarding_draft");
    setActivated(true);
    setLoading(false);
  }

  /* ── CAN PROCEED ── */
  const canNext = (): boolean => {
    if (step === 1) return !!data.botUsername;
    if (step === 2) return data.name.trim().length > 0;
    if (step === 6) return data.calendarConnected;
    return true;
  };

  /* ── TOGGLE HELPER ── */
  function toggle(field: "allowsDogs" | "hasGlutenFree" | "hasOutdoor") {
    setData(d => ({ ...d, [field]: !d[field] }));
  }

  /* ── CHIP HELPER ── */
  function toggleChip(field: "types" | "cuisine", value: string) {
    setData(d => {
      const arr = d[field] as string[];
      return { ...d, [field]: arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value] };
    });
  }

  const progress = ((step - 1) / 7) * 100;
  const btnPrimary: CSSProperties = {
    width: "100%", padding: "0.85rem", background: "#0EA5E9", color: "#fff",
    border: "none", borderRadius: "999px", fontSize: "0.95rem", fontWeight: 600,
    fontFamily: "inherit", cursor: "pointer",
  };

  /* ── RENDER ── */
  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at top, #1a2f3a 0%, #111a14 60%)",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "2rem 1rem 4rem",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: "#f0f8f2",
    }}>
      <a href="/" style={{ textDecoration: "none", marginBottom: "2.5rem" }}>
        <img src="/logo.png" alt="RistoAgent" style={{ height: 44, width: "auto" }} />
      </a>

      <div style={{
        background: "#1a2420", border: "1px solid #2e4035",
        borderRadius: "1.4rem", padding: "2.5rem 2rem",
        width: "100%", maxWidth: "540px",
        boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
      }}>
        {/* ── Progress header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "0.72rem", color: "#7a9b7e", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {STEP_LABELS[step - 1]}
          </span>
          <span style={{ fontSize: "0.72rem", color: "#4a6a50" }}>{step} / 8</span>
        </div>
        <div style={{ height: 4, background: "#1e2b20", borderRadius: 999, marginBottom: "1.8rem" }}>
          <div style={{ height: "100%", background: "#0EA5E9", borderRadius: 999, width: `${progress}%`, transition: "width 0.4s ease" }} />
        </div>
        {/* Segment dots */}
        <div style={{ display: "flex", gap: 3, marginBottom: "2rem" }}>
          {STEP_LABELS.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 999,
              background: i + 1 < step ? "#0EA5E9" : i + 1 === step ? "#22c55e" : "#1e2b20",
              transition: "background 0.3s",
            }} />
          ))}
        </div>

        {/* ── Error ── */}
        {error && (
          <div style={{
            background: "rgba(255,107,107,0.1)", border: "1px solid #ff6b6b",
            borderRadius: "0.6rem", padding: "0.75rem 1rem",
            marginBottom: "1.2rem", color: "#ff6b6b", fontSize: "0.85rem",
          }}>{error}</div>
        )}

        {/* ════════════════════════════════════
            STEP 1 — Bot Telegram
        ════════════════════════════════════ */}
        {step === 1 && (
          <div>
            <h1 style={{ fontSize: "1.7rem", fontWeight: 700, marginBottom: "0.4rem" }}>
              Collega il tuo bot Telegram
            </h1>
            <p style={{ color: "#7a9b7e", fontSize: "0.88rem", marginBottom: "1.8rem", lineHeight: 1.6 }}>
              Il bot è il canale attraverso cui i clienti prenoteranno.
              Crearlo su Telegram è gratuito e richiede 2 minuti.
            </p>

            <div style={{ background: "#131a14", border: "1px solid #1e2b20", borderRadius: "0.8rem", padding: "1.2rem", marginBottom: "1.5rem" }}>
              <p style={{ fontSize: "0.7rem", color: "#0EA5E9", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.8rem", fontWeight: 600 }}>
                Guida rapida — 3 passi
              </p>
              {[
                "Apri Telegram → cerca @BotFather",
                "Invia /newbot, scegli nome e username (deve finire con \"bot\")",
                "Copia il token che BotFather ti invia e incollalo qui sotto",
              ].map((t, i) => (
                <div key={i} style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                  <span style={{
                    minWidth: 20, height: 20, borderRadius: "50%", background: "#0EA5E9", color: "#fff",
                    fontSize: "0.65rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>{i + 1}</span>
                  <p style={{ fontSize: "0.83rem", color: "#e8f0e9", lineHeight: 1.5 }}>{t}</p>
                </div>
              ))}
            </div>

            <label style={lbl}>Token BotFather *</label>
            <input
              value={data.botToken}
              onChange={e => setData(d => ({ ...d, botToken: e.target.value, botUsername: "", botName: "" }))}
              onKeyDown={e => e.key === "Enter" && validateBot()}
              placeholder="1234567890:AAFabcdefghijklmnopqrstuvwxyz"
              style={{ ...inp, fontFamily: "monospace", marginBottom: "0.5rem" }}
              autoFocus
            />
            <p style={{ fontSize: "0.75rem", color: "#6a8a72", marginBottom: "1.5rem" }}>
              🔒 Il token è salvato in modo sicuro e non viene mai condiviso.
            </p>

            {data.botUsername && (
              <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "0.6rem", padding: "0.7rem 1rem", marginBottom: "1rem" }}>
                <p style={{ fontSize: "0.85rem", color: "#4ade80" }}>✅ Bot connesso — @{data.botUsername}</p>
              </div>
            )}

            <button onClick={validateBot} disabled={!data.botToken.trim() || loading}
              style={{ ...btnPrimary, opacity: (!data.botToken.trim() || loading) ? 0.4 : 1 }}>
              {loading ? "Verifica in corso..." : data.botUsername ? "Continua →" : "Verifica bot →"}
            </button>
          </div>
        )}

        {/* ════════════════════════════════════
            STEP 2 — Profilo ristorante
        ════════════════════════════════════ */}
        {step === 2 && (
          <div>
            <h1 style={{ fontSize: "1.7rem", fontWeight: 700, marginBottom: "0.4rem" }}>Il tuo ristorante</h1>
            <p style={{ color: "#7a9b7e", fontSize: "0.88rem", marginBottom: "1.8rem" }}>
              Queste informazioni identificano la tua attività nel sistema.
            </p>

            <label style={lbl}>Nome attività *</label>
            <input
              value={data.name}
              onChange={e => setData(d => ({ ...d, name: e.target.value }))}
              placeholder="es. Trattoria da Mario"
              style={{ ...inp, marginBottom: "1.2rem" }}
              autoFocus
            />

            <label style={lbl}>Città</label>
            <input
              value={data.city}
              onChange={e => setData(d => ({ ...d, city: e.target.value }))}
              placeholder="es. Milano"
              style={{ ...inp, marginBottom: "1.2rem" }}
            />

            <label style={lbl}>Tipo attività <span style={{ fontWeight: 400, textTransform: "none", fontSize: "0.7rem", color: "#6a8a72" }}>(puoi selezionarne più)</span></label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1.2rem" }}>
              {RESTAURANT_TYPES.map(t => {
                const sel = data.types.includes(t);
                return (
                  <button key={t} onClick={() => toggleChip("types", t)} style={{
                    padding: "0.6rem 0.7rem", background: sel ? "rgba(14,165,233,0.15)" : "#131a14",
                    border: `1px solid ${sel ? "#0EA5E9" : "#2a3f2e"}`,
                    borderRadius: "0.6rem", color: sel ? "#0EA5E9" : "#c0d8c8",
                    fontSize: "0.82rem", fontFamily: "inherit", cursor: "pointer",
                    textAlign: "left", fontWeight: sel ? 600 : 400,
                  }}>{sel ? "✓ " : ""}{t}</button>
                );
              })}
            </div>

            <label style={lbl}>
              Partita IVA / Codice Fiscale{" "}
              <span style={{ fontWeight: 400, textTransform: "none", fontSize: "0.7rem", color: "#6a8a72" }}>(opzionale)</span>
            </label>
            <input
              value={data.partitaIva}
              onChange={e => setData(d => ({ ...d, partitaIva: e.target.value.toUpperCase() }))}
              placeholder="es. IT12345678901"
              style={{ ...inp, fontFamily: "monospace" }}
            />
            <p style={{ fontSize: "0.72rem", color: "#6a8a72", marginTop: "0.3rem" }}>
              Usata solo per verificare l&apos;unicità della prova gratuita.
            </p>
          </div>
        )}

        {/* ════════════════════════════════════
            STEP 3 — Info per il bot
        ════════════════════════════════════ */}
        {step === 3 && (
          <div>
            <h1 style={{ fontSize: "1.7rem", fontWeight: 700, marginBottom: "0.4rem" }}>
              Cosa deve sapere il bot?
            </h1>
            <p style={{ color: "#7a9b7e", fontSize: "0.88rem", marginBottom: "0.6rem", lineHeight: 1.6 }}>
              Queste informazioni determinano la qualità delle risposte ai tuoi clienti.
            </p>
            <div style={warn}>
              ⚠️ Senza queste info il bot darà risposte vaghe — più dati dai, più il bot vende per te.
            </div>

            <label style={lbl}>Tipo di cucina</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "1.5rem" }}>
              {CUISINE_CHIPS.map(c => {
                const sel = data.cuisine.includes(c);
                return (
                  <button key={c} onClick={() => toggleChip("cuisine", c)} style={{
                    padding: "0.4rem 0.9rem", background: sel ? "rgba(14,165,233,0.15)" : "#131a14",
                    border: `1px solid ${sel ? "#0EA5E9" : "#2a3f2e"}`,
                    borderRadius: "999px", color: sel ? "#0EA5E9" : "#c0d8c8",
                    fontSize: "0.82rem", fontFamily: "inherit", cursor: "pointer", fontWeight: sel ? 600 : 400,
                  }}>{sel ? "✓ " : ""}{c}</button>
                );
              })}
            </div>

            {(["allowsDogs", "hasGlutenFree", "hasOutdoor"] as const).map(field => {
              const labels = {
                allowsDogs: { emoji: "🐶", title: "Animali ammessi", sub: "Il bot lo comunicherà ai clienti" },
                hasGlutenFree: { emoji: "🌾", title: "Opzioni senza glutine", sub: "Importante per clienti celiaci" },
                hasOutdoor: { emoji: "☀️", title: "Tavoli all'aperto / terrazza", sub: "I clienti lo chiedono spesso" },
              };
              const { emoji, title, sub } = labels[field];
              const val = data[field];
              return (
                <div key={field} onClick={() => toggle(field)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "0.85rem 1rem", background: "#131a14",
                    border: `1px solid ${val ? "#0EA5E9" : "#2a3f2e"}`,
                    borderRadius: "0.6rem", marginBottom: "0.6rem", cursor: "pointer",
                  }}>
                  <div>
                    <p style={{ fontSize: "0.88rem", fontWeight: 600, marginBottom: "0.1rem" }}>{emoji} {title}</p>
                    <p style={{ fontSize: "0.72rem", color: "#7a9b7e" }}>{sub}</p>
                  </div>
                  <div style={{ width: 40, height: 22, borderRadius: 999, background: val ? "#0EA5E9" : "#2a3f2e", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                    <div style={{ position: "absolute", top: 3, left: val ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                  </div>
                </div>
              );
            })}

            <label style={{ ...lbl, marginTop: "1.2rem" }}>Note aggiuntive</label>
            <textarea
              value={data.notes}
              onChange={e => setData(d => ({ ...d, notes: e.target.value }))}
              rows={3}
              placeholder="es. Parcheggio gratuito in Via Verdi, accettiamo carte, ambiente informale, chiusura estiva ad agosto…"
              style={{ ...inp, resize: "vertical", lineHeight: 1.6 } as CSSProperties}
            />
          </div>
        )}

        {/* ════════════════════════════════════
            STEP 4 — Tavoli
        ════════════════════════════════════ */}
        {step === 4 && (
          <div>
            <h1 style={{ fontSize: "1.7rem", fontWeight: 700, marginBottom: "0.4rem" }}>
              Capacità del ristorante
            </h1>
            <p style={{ color: "#7a9b7e", fontSize: "0.88rem", marginBottom: "0.6rem" }}>
              Il numero di tavoli permette al bot di gestire correttamente le disponibilità.
            </p>
            {showTablesWarn && (
              <div style={warn}>
                ⚠️ Senza il numero di tavoli, il bot non sa quando il ristorante è pieno.
              </div>
            )}

            {(["t2", "t4", "t6"] as const).map((field) => {
              const tableLabels = { t2: "Tavoli da 2 persone", t4: "Tavoli da 4 persone", t6: "Tavoli da 6+ persone" };
              return (
                <div key={field} style={{ marginBottom: "1.1rem" }}>
                  <label style={lbl}>{tableLabels[field]}</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                    <button
                      onClick={() => setData(d => ({ ...d, tables: { ...d.tables, [field]: Math.max(0, d.tables[field] - 1) } }))}
                      style={{ width: 36, height: 36, borderRadius: "50%", background: "#131a14", border: "1px solid #2a3f2e", color: "#f0f8f2", fontSize: "1.2rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      −
                    </button>
                    <span style={{ fontSize: "1.4rem", fontWeight: 700, minWidth: 32, textAlign: "center" }}>
                      {data.tables[field]}
                    </span>
                    <button
                      onClick={() => { setShowTablesWarn(false); setData(d => ({ ...d, tables: { ...d.tables, [field]: d.tables[field] + 1 } })); }}
                      style={{ width: 36, height: 36, borderRadius: "50%", background: "#131a14", border: "1px solid #2a3f2e", color: "#f0f8f2", fontSize: "1.2rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      +
                    </button>
                  </div>
                </div>
              );
            })}

            <div
              onClick={() => setData(d => ({ ...d, tables: { ...d.tables, terrace: !d.tables.terrace } }))}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0.85rem 1rem", background: "#131a14",
                border: `1px solid ${data.tables.terrace ? "#0EA5E9" : "#2a3f2e"}`,
                borderRadius: "0.6rem", cursor: "pointer", marginBottom: "1.2rem", marginTop: "0.4rem",
              }}>
              <p style={{ fontSize: "0.88rem", fontWeight: 600 }}>☀️ Hai una terrazza / area esterna?</p>
              <div style={{ width: 40, height: 22, borderRadius: 999, background: data.tables.terrace ? "#0EA5E9" : "#2a3f2e", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                <div style={{ position: "absolute", top: 3, left: data.tables.terrace ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
              </div>
            </div>

            {totalSeats(data.tables) > 0 && (
              <div style={{ background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.2)", borderRadius: "0.6rem", padding: "0.7rem 1rem", textAlign: "center" }}>
                <p style={{ fontSize: "0.88rem", color: "#7dd3fc" }}>
                  Capacità totale: <strong style={{ color: "#0EA5E9" }}>{totalSeats(data.tables)} coperti</strong>
                </p>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════
            STEP 5 — Orari
        ════════════════════════════════════ */}
        {step === 5 && (
          <div>
            <h1 style={{ fontSize: "1.7rem", fontWeight: 700, marginBottom: "0.4rem" }}>
              Quando sei aperto?
            </h1>
            <p style={{ color: "#7a9b7e", fontSize: "0.88rem", marginBottom: "0.6rem" }}>
              Definisci gli orari per pranzo e cena — lascia vuoti i campi per i turni non attivi.
            </p>
            <div style={warn}>
              ⚠️ Senza gli orari, il bot accetta prenotazioni anche quando sei chiuso.
            </div>

            {DAYS.map(({ key: dayKey, label }) => {
              const h = data.hours[dayKey];
              const isOpen = h != null;
              const dayH = isOpen ? (h as { lunch?: string; dinner?: string }) : null;
              return (
                <div key={dayKey} style={{
                  marginBottom: "0.7rem", background: "#131a14",
                  border: `1px solid ${isOpen ? "#2a3f2e" : "#1a2420"}`,
                  borderRadius: "0.7rem", overflow: "hidden",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.7rem 1rem" }}>
                    <span style={{ fontSize: "0.88rem", fontWeight: 600, minWidth: 80 }}>{label}</span>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <button
                        onClick={() => setData(d => ({ ...d, hours: { ...d.hours, [dayKey]: null } }))}
                        style={{ padding: "0.22rem 0.7rem", borderRadius: "999px", border: "none", fontFamily: "inherit", cursor: "pointer", fontSize: "0.72rem", background: !isOpen ? "#dc2626" : "#1e2b20", color: !isOpen ? "#fff" : "#7a9b7e" }}>
                        Chiuso
                      </button>
                      <button
                        onClick={() => setData(d => ({ ...d, hours: { ...d.hours, [dayKey]: d.hours[dayKey] ?? {} } }))}
                        style={{ padding: "0.22rem 0.7rem", borderRadius: "999px", border: "none", fontFamily: "inherit", cursor: "pointer", fontSize: "0.72rem", background: isOpen ? "#22c55e" : "#1e2b20", color: isOpen ? "#0a0f0d" : "#7a9b7e" }}>
                        Aperto
                      </button>
                    </div>
                  </div>
                  {isOpen && (
                    <div style={{ padding: "0 1rem 0.8rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                      {(["lunch", "dinner"] as const).map(slot => (
                        <div key={slot}>
                          <label style={{ ...lbl, marginBottom: "0.25rem" }}>
                            {slot === "lunch" ? "Pranzo" : "Cena"}
                          </label>
                          <input
                            value={dayH?.[slot] ?? ""}
                            onChange={e => setData(d => ({
                              ...d,
                              hours: {
                                ...d.hours,
                                [dayKey]: {
                                  ...(d.hours[dayKey] ?? {}),
                                  [slot]: e.target.value || undefined,
                                },
                              },
                            }))}
                            placeholder="12:00-14:30"
                            style={{ ...inp, width: 120, fontSize: "0.82rem", fontFamily: "monospace", padding: "0.5rem 0.7rem" }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ════════════════════════════════════
            STEP 6 — Google Calendar
        ════════════════════════════════════ */}
        {step === 6 && (
          <div>
            <h1 style={{ fontSize: "1.7rem", fontWeight: 700, marginBottom: "0.4rem" }}>
              Attiva il sistema di prenotazioni automatiche
            </h1>
            <p style={{ color: "#7a9b7e", fontSize: "0.88rem", marginBottom: "0.6rem", lineHeight: 1.6 }}>
              Ogni prenotazione viene salvata automaticamente nel tuo calendario.
            </p>
            <div style={warn}>
              ⚠️ Senza questo passaggio, il bot non può confermare prenotazioni.
            </div>

            {!data.calendarConnected ? (
              <>
                <div style={{ background: "#131a14", border: "1px solid #1e2b20", borderRadius: "0.8rem", padding: "1.2rem", marginBottom: "1.5rem" }}>
                  {[
                    "Si apre Google per il login",
                    "Autorizzi RistoAgent ad accedere al calendario",
                    "Torni qui con il sistema attivo",
                  ].map((t, i) => (
                    <div key={i} style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                      <span style={{ minWidth: 20, height: 20, borderRadius: "50%", background: "#0EA5E9", color: "#fff", fontSize: "0.65rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                      <p style={{ fontSize: "0.83rem", color: "#e8f0e9", lineHeight: 1.5 }}>{t}</p>
                    </div>
                  ))}
                </div>
                <button onClick={connectGoogle} style={btnPrimary}>
                  🔗 Connetti Google Calendar →
                </button>
              </>
            ) : (
              <>
                <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "0.8rem", padding: "1.2rem", marginBottom: "1.2rem", textAlign: "center" }}>
                  <p style={{ fontSize: "2rem", marginBottom: "0.3rem" }}>✅</p>
                  <p style={{ fontWeight: 700, color: "#4ade80", fontSize: "1rem" }}>Sistema attivo</p>
                  <p style={{ fontSize: "0.82rem", color: "#7a9b7e", marginTop: "0.2rem" }}>
                    Il calendario è collegato e pronto a salvare prenotazioni.
                  </p>
                </div>
                {/* Mini simulation */}
                <div style={{ background: "#131a14", border: "1px solid #1e2b20", borderRadius: "0.8rem", padding: "1rem 1.2rem" }}>
                  <p style={{ fontSize: "0.65rem", color: "#0EA5E9", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.8rem", fontWeight: 600 }}>
                    Simulazione
                  </p>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.5rem" }}>
                    <div style={{ background: "#22c55e", color: "#0a0f0d", padding: "0.45rem 0.8rem", borderRadius: "0.8rem 0.8rem 0.2rem 0.8rem", fontSize: "0.82rem", maxWidth: "80%" }}>
                      Prenota per 2 domani alle 20
                    </div>
                  </div>
                  <div style={{ marginBottom: "0.6rem" }}>
                    <div style={{ background: "#1c2b1e", color: "#e8f0e9", padding: "0.45rem 0.8rem", borderRadius: "0.8rem 0.8rem 0.8rem 0.2rem", fontSize: "0.82rem", maxWidth: "80%" }}>
                      Perfetto! Tavolo per 2 confermato per domani alle 20:00. ✅
                    </div>
                  </div>
                  <div style={{ borderTop: "1px solid #1e2b20", paddingTop: "0.6rem" }}>
                    <p style={{ fontSize: "0.72rem", color: "#4ade80" }}>✔ Salvato nel tuo calendario</p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ════════════════════════════════════
            STEP 7 — Regole
        ════════════════════════════════════ */}
        {step === 7 && (
          <div>
            <h1 style={{ fontSize: "1.7rem", fontWeight: 700, marginBottom: "0.4rem" }}>
              Regole di prenotazione
            </h1>
            <p style={{ color: "#7a9b7e", fontSize: "0.88rem", marginBottom: "0.6rem" }}>
              Queste regole evitano prenotazioni impossibili o doppie.
            </p>
            <div style={{ ...warn, color: "#7dd3fc", background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.15)" }}>
              💡 I valori predefiniti vanno bene per la maggior parte dei ristoranti — modifica solo se necessario.
            </div>

            <label style={lbl}>Durata media prenotazione</label>
            <select value={data.rules.durationMin}
              onChange={e => setData(d => ({ ...d, rules: { ...d.rules, durationMin: Number(e.target.value) } }))}
              style={{ ...inp, marginBottom: "1.2rem" }}>
              {[60, 75, 90, 105, 120, 150, 180].map(v => (
                <option key={v} value={v}>{v} minuti</option>
              ))}
            </select>

            <label style={lbl}>Tolleranza ritardo massima</label>
            <select value={data.rules.delayMin}
              onChange={e => setData(d => ({ ...d, rules: { ...d.rules, delayMin: Number(e.target.value) } }))}
              style={{ ...inp, marginBottom: "1.2rem" }}>
              <option value={0}>Nessuna tolleranza</option>
              {[10, 15, 20, 30].map(v => <option key={v} value={v}>{v} minuti</option>)}
            </select>

            <label style={lbl}>Preavviso minimo per prenotare</label>
            <select value={data.rules.noticeHours}
              onChange={e => setData(d => ({ ...d, rules: { ...d.rules, noticeHours: Number(e.target.value) } }))}
              style={inp}>
              <option value={0.5}>30 minuti</option>
              <option value={1}>1 ora</option>
              <option value={2}>2 ore</option>
              <option value={4}>4 ore</option>
              <option value={24}>24 ore</option>
            </select>
          </div>
        )}

        {/* ════════════════════════════════════
            STEP 8 — Attivazione
        ════════════════════════════════════ */}
        {step === 8 && (
          <div>
            {!activated ? (
              <>
                <h1 style={{ fontSize: "1.7rem", fontWeight: 700, marginBottom: "0.4rem" }}>
                  Tutto configurato! 🎉
                </h1>
                <p style={{ color: "#7a9b7e", fontSize: "0.88rem", marginBottom: "1.8rem", lineHeight: 1.6 }}>
                  Il tuo sistema è pronto. Premi il bottone per attivarlo — ci vogliono pochi secondi.
                </p>

                {/* Summary */}
                <div style={{ background: "#131a14", border: "1px solid #1e2b20", borderRadius: "0.8rem", padding: "1.2rem", marginBottom: "1.5rem" }}>
                  <p style={{ fontSize: "0.7rem", color: "#0EA5E9", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.8rem", fontWeight: 600 }}>Riepilogo configurazione</p>
                  {[
                    { label: "Bot Telegram", value: data.botUsername ? `@${data.botUsername}` : "—" },
                    { label: "Ristorante", value: data.name || "—" },
                    { label: "Coperti configurati", value: totalSeats(data.tables) > 0 ? `${totalSeats(data.tables)} coperti` : "Non specificati" },
                    { label: "Google Calendar", value: data.calendarConnected ? "Collegato ✓" : "Non collegato" },
                    { label: "Durata prenotazione", value: `${data.rules.durationMin} min` },
                  ].map(row => (
                    <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "0.3rem 0", borderBottom: "1px solid #1e2b20", fontSize: "0.83rem" }}>
                      <span style={{ color: "#7a9b7e" }}>{row.label}</span>
                      <strong style={{ color: "#e8f0e9", fontWeight: 500 }}>{row.value}</strong>
                    </div>
                  ))}
                </div>

                <button onClick={activate} disabled={loading}
                  style={{ ...btnPrimary, opacity: loading ? 0.5 : 1 }}>
                  {loading ? "Attivazione in corso..." : "Attiva il mio sistema prenotazioni →"}
                </button>
              </>
            ) : (
              <>
                <h1 style={{ fontSize: "1.7rem", fontWeight: 700, marginBottom: "0.4rem" }}>
                  Il tuo sistema è pronto ✅
                </h1>
                <p style={{ color: "#7a9b7e", fontSize: "0.88rem", marginBottom: "1.5rem" }}>
                  RistoAgent è attivo. Scarica il QR code e condividilo ovunque.
                </p>

                {/* Simulation box */}
                <div style={{ background: "#131a14", border: "1px solid #1e2b20", borderRadius: "0.8rem", padding: "1rem 1.2rem", marginBottom: "1.2rem" }}>
                  <p style={{ fontSize: "0.65rem", color: "#0EA5E9", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.8rem", fontWeight: 600 }}>
                    Simulazione — prenotazione in tempo reale
                  </p>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.5rem" }}>
                    <div style={{ background: "#22c55e", color: "#0a0f0d", padding: "0.45rem 0.9rem", borderRadius: "0.8rem 0.8rem 0.2rem 0.8rem", fontSize: "0.83rem" }}>
                      Prenota per 2 domani alle 20
                    </div>
                  </div>
                  <div style={{ marginBottom: "0.6rem" }}>
                    <div style={{ background: "#1c2b1e", color: "#e8f0e9", padding: "0.45rem 0.9rem", borderRadius: "0.8rem 0.8rem 0.8rem 0.2rem", fontSize: "0.83rem", maxWidth: "85%" }}>
                      Perfetto! Tavolo per 2 confermato per domani alle 20:00.
                      Ti aspettiamo! 🍽️
                    </div>
                  </div>
                  <div style={{ borderTop: "1px solid #1e2b20", paddingTop: "0.6rem" }}>
                    <p style={{ fontSize: "0.72rem", color: "#4ade80" }}>✔ Salvato nel tuo calendario</p>
                  </div>
                </div>
                <p style={{ fontSize: "0.78rem", color: "#7a9b7e", marginBottom: "1.5rem", fontStyle: "italic", textAlign: "center" }}>
                  Questo è esattamente ciò che succede quando un cliente ti scrive su Telegram.
                </p>

                {/* QR */}
                {qrDataUrl && (
                  <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                    <img src={qrDataUrl} alt="QR Code" style={{ width: 160, height: 160, borderRadius: "0.8rem", background: "#fff", padding: "0.5rem" }} />
                    <p style={{ fontSize: "0.75rem", color: "#7a9b7e", margin: "0.5rem 0" }}>
                      Mettilo sul menu, ai tavoli o sui social
                    </p>
                    <button onClick={() => {
                      const a = document.createElement("a");
                      a.href = qrDataUrl;
                      a.download = `ristoagent-qr-${data.botUsername}.png`;
                      a.click();
                    }} style={{
                      padding: "0.5rem 1.2rem", background: "transparent",
                      border: "1px solid #0EA5E9", borderRadius: "999px",
                      color: "#0EA5E9", fontSize: "0.83rem", fontFamily: "inherit", cursor: "pointer",
                    }}>
                      ⬇ Scarica QR Code
                    </button>
                  </div>
                )}

                <button onClick={() => router.push("/dashboard")} style={btnPrimary}>
                  Vai alla Dashboard →
                </button>
              </>
            )}
          </div>
        )}

        {/* ── NAV BUTTONS ── */}
        {step > 1 && step < 8 && (
          <div style={{ display: "flex", gap: "0.8rem", marginTop: "2rem" }}>
            <button onClick={back} style={{
              background: "transparent", border: "1px solid #1e2b20", borderRadius: "999px",
              color: "#7a9b7e", fontSize: "0.88rem", fontFamily: "inherit",
              padding: "0.75rem 1.2rem", cursor: "pointer",
            }}>← Indietro</button>

            {/* Step 6: Continua only after calendar connected */}
            {step === 6 && data.calendarConnected && (
              <button onClick={() => go(data, 7)} style={{ ...btnPrimary, flex: 1, background: "#22c55e", color: "#0a0f0d" }}>
                Continua →
              </button>
            )}

            {/* Steps 2-5, 7: standard Continua */}
            {step !== 6 && (
              <button
                onClick={() => {
                  if (step === 4 && data.tables.t2 === 0 && data.tables.t4 === 0 && data.tables.t6 === 0) {
                    setShowTablesWarn(true);
                  }
                  if (step === 2) { saveProfile(); } else { go(data, step + 1); }
                }}
                disabled={!canNext() || loading}
                style={{ ...btnPrimary, flex: 1, opacity: (!canNext() || loading) ? 0.35 : 1 }}>
                {loading ? "Salvataggio..." : "Continua →"}
              </button>
            )}
          </div>
        )}

        {/* Indietro on step 8 pre-activation */}
        {step === 8 && !activated && (
          <div style={{ marginTop: "1.2rem", textAlign: "center" }}>
            <button onClick={back} style={{
              background: "transparent", border: "none", color: "#4a6a50",
              fontSize: "0.82rem", fontFamily: "inherit", cursor: "pointer",
            }}>← Torna indietro</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Onboarding() {
  return (
    <Suspense>
      <OnboardingInner />
    </Suspense>
  );
}
