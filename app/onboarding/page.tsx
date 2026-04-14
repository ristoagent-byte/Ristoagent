"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { BusinessType } from "@/types";

const BUSINESS_TYPES: BusinessType[] = [
  "Ristorante / Pizzeria", "Bar / Caffetteria", "Agriturismo",
  "Parrucchiere / Barbiere", "Centro Estetico / SPA",
  "Palestra / Studio Fitness", "Studio Medico / Dentista", "Altro",
];

const STEPS = [
  { number: 1, label: "La tua attività" },
  { number: 2, label: "Servizi & Orari" },
  { number: 3, label: "Google Calendar" },
  { number: 4, label: "Bot Telegram" },
  { number: 5, label: "Attiva" },
];

type FormData = {
  businessName: string;
  businessTypes: string[];
  partitaIva: string;
  services: string;
  openingHours: string;
  extraInfo: string;
  telegramToken: string;
};

function OnboardingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = getSupabaseBrowser();

  const [step, setStep] = useState(Number(searchParams.get("step") ?? 1));
  const [userId, setUserId] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormData>({
    businessName: "", businessTypes: [], partitaIva: "", services: "", openingHours: "", extraInfo: "", telegramToken: "",
  });

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push("/auth"); return; }
      setUserId(data.user.id);

      // Load existing business data if present
      const { data: biz } = await supabase
        .from("businesses")
        .select("*")
        .eq("user_id", data.user.id)
        .single();

      if (biz) {
        const b = biz as Record<string, string>;
        setBusinessId(b.id);
        const rawServices: string = b.services ?? "";
        const splitMarker = "\n\nINFORMAZIONI PRATICHE:\n";
        const splitIdx = rawServices.indexOf(splitMarker);
        const servicesOnly = splitIdx >= 0 ? rawServices.slice(0, splitIdx) : rawServices;
        const extraInfoOnly = splitIdx >= 0 ? rawServices.slice(splitIdx + splitMarker.length) : "";
        setForm((f) => ({
          ...f,
          businessName: b.name ?? "",
          businessTypes: b.type ? b.type.split(", ") : [],
          partitaIva: b.partita_iva ?? "",
          services: servicesOnly,
          openingHours: b.opening_hours ?? "",
          extraInfo: extraInfoOnly,
        }));
        if (b.google_access_token) setGoogleConnected(true);
      }
    });
    if (searchParams.get("google") === "connected") setGoogleConnected(true);
    if (searchParams.get("error") === "google_denied") setError("Accesso Google negato. Riprova.");
    if (searchParams.get("error") === "google_failed") setError("Errore connessione Google. Riprova.");
  }, []);

  const update = (field: keyof FormData, value: string | string[]) =>
    setForm((f) => ({ ...f, [field]: value }));

  async function handleCheckPivaAndProceed() {
    setLoading(true); setError("");
    const piva = form.partitaIva.trim().toUpperCase();
    const res = await fetch(`/api/business/check-piva?piva=${encodeURIComponent(piva)}&userId=${userId}`);
    const data = await res.json();
    setLoading(false);
    if (!res.ok || data.blocked) {
      setError("La prova gratuita è già stata utilizzata per questa attività (P.IVA già registrata). Scegli un piano per continuare.");
      return;
    }
    setStep(2);
  }

  async function handleSaveStep2() {
    setLoading(true); setError("");
    const method = businessId ? "PUT" : "POST";
    const res = await fetch("/api/business", {
      method,
      headers: { "Content-Type": "application/json", "x-user-id": userId! },
      body: JSON.stringify({
        name: form.businessName,
        type: form.businessTypes.join(", "),
        partita_iva: form.partitaIva.trim().toUpperCase(),
        services: form.services + (form.extraInfo ? `\n\nINFORMAZIONI PRATICHE:\n${form.extraInfo}` : ""),
        opening_hours: form.openingHours,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }
    setBusinessId(data.id);
    setLoading(false);
    setStep(3);
  }

  async function handleConnectGoogle() {
    window.location.href = `/api/google/auth?userId=${userId}`;
  }

  async function handleSaveTelegramToken() {
    setLoading(true); setError("");
    const res = await fetch("/api/business", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-user-id": userId! },
      body: JSON.stringify({ telegram_bot_token: form.telegramToken }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }
    setBotUsername(data.telegram_bot_username);

    const qrRes = await fetch(`/api/qrcode?username=${data.telegram_bot_username}`, {
      headers: { "x-user-id": userId! },
    });
    if (qrRes.ok) {
      const blob = await qrRes.blob();
      setQrDataUrl(URL.createObjectURL(blob));
    }

    setLoading(false);
    setStep(5);
  }

  function downloadQR() {
    if (!qrDataUrl || !botUsername) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `ristoagent-qr-${botUsername}.png`;
    a.click();
  }

  const canProceed = () => {
    if (step === 1) return form.businessName.trim() && form.businessTypes.length > 0 && form.partitaIva.trim().length >= 5;
    if (step === 2) return form.services.trim() && form.openingHours.trim() && form.businessName.trim();
    if (step === 3) return true;
    if (step === 4) return form.telegramToken.trim().length > 20;
    return true;
  };

  const progress = ((step - 1) / 4) * 100;

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at top, #1a2f3a 0%, #111a14 60%)",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "2rem 1rem 4rem",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: "#f0f8f2",
    }}>
      <a href="/" style={{ textDecoration: "none", marginBottom: "2.5rem" }}>
        <img src="/logo.png" alt="RistoAgent" style={{ height: 44, width: "auto", }} />
      </a>

      <div style={{
        background: "#1a2420", border: "1px solid #2e4035", borderRadius: "1.4rem",
        padding: "2.5rem 2rem", width: "100%", maxWidth: "540px",
        boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
      }}>
        {/* Step indicators */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
          {STEPS.map((s) => (
            <div key={s.number} style={{ display: "flex", flexDirection: "column",
              alignItems: "center", gap: "0.3rem", flex: 1,
              opacity: step >= s.number ? 1 : 0.35, transition: "opacity 0.3s" }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: step >= s.number ? "#0EA5E9" : "#1e2b20",
                border: `1px solid ${step >= s.number ? "#0EA5E9" : "#2a3e2c"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.75rem", fontWeight: 500,
                color: step >= s.number ? "#fff" : "#7a9b7e",
              }}>
                {step > s.number ? "✓" : s.number}
              </div>
              <span style={{ fontSize: "0.6rem", textTransform: "uppercase",
                letterSpacing: "0.05em", color: "#7a9b7e", textAlign: "center" }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
        <div style={{ height: 3, background: "#1e2b20", borderRadius: 999,
          marginBottom: "2rem", overflow: "hidden" }}>
          <div style={{ height: "100%", background: "#0EA5E9",
            borderRadius: 999, width: `${progress}%`, transition: "width 0.4s ease" }} />
        </div>

        {error && (
          <div style={{ background: "rgba(255,107,107,0.1)", border: "1px solid #ff6b6b",
            borderRadius: "0.6rem", padding: "0.75rem 1rem", marginBottom: "1rem",
            color: "#ff6b6b", fontSize: "0.85rem" }}>
            {error}
          </div>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "0.4rem", color: "#f0f8f2" }}>
              Raccontaci la tua attività
            </h1>
            <p style={{ color: "#9ab8a0", fontSize: "0.92rem", marginBottom: "1.8rem" }}>
              Queste informazioni permettono all&apos;AI di rispondere correttamente ai tuoi clienti.
            </p>
            <label style={{ display: "block", fontSize: "0.78rem", textTransform: "uppercase",
              letterSpacing: "0.07em", color: "#a0c0a8", marginBottom: "0.5rem", fontWeight: 600 }}>
              Nome attività *
            </label>
            <input placeholder="es. Trattoria da Mario"
              value={form.businessName} onChange={(e) => update("businessName", e.target.value)}
              autoFocus style={{ width: "100%", padding: "0.85rem 1rem", background: "#131a14",
                border: "1px solid #2a3f2e", borderRadius: "0.6rem", color: "#f0f8f2",
                fontSize: "1rem", fontFamily: "inherit", outline: "none",
                marginBottom: "1.2rem", boxSizing: "border-box" }} />
            <label style={{ display: "block", fontSize: "0.78rem", textTransform: "uppercase",
              letterSpacing: "0.07em", color: "#a0c0a8", marginBottom: "0.3rem", fontWeight: 600 }}>
              Tipo di attività * <span style={{ fontSize: "0.72rem", color: "#6a8a72", fontWeight: 400, textTransform: "none" }}>(puoi selezionarne più di uno)</span>
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem",
              marginBottom: "1.2rem" }}>
              {BUSINESS_TYPES.map((t) => {
                const selected = form.businessTypes.includes(t);
                return (
                  <button key={t} onClick={() => {
                    const curr = form.businessTypes;
                    update("businessTypes", selected
                      ? curr.filter((x) => x !== t)
                      : [...curr, t]);
                  }} style={{
                    padding: "0.7rem 0.8rem",
                    background: selected ? "rgba(14,165,233,0.15)" : "#131a14",
                    border: `1px solid ${selected ? "#0EA5E9" : "#2a3f2e"}`,
                    borderRadius: "0.6rem",
                    color: selected ? "#0EA5E9" : "#c0d8c8",
                    fontSize: "0.85rem", fontFamily: "inherit", cursor: "pointer", textAlign: "left",
                    transition: "all 0.2s", fontWeight: selected ? 600 : 400,
                  }}>
                    {selected ? "✓ " : ""}{t}
                  </button>
                );
              })}
            </div>
            <label style={{ display: "block", fontSize: "0.78rem", textTransform: "uppercase",
              letterSpacing: "0.07em", color: "#a0c0a8", marginBottom: "0.5rem", fontWeight: 600 }}>
              Partita IVA / Codice Fiscale attività *
            </label>
            <input
              placeholder="es. IT12345678901 oppure BRNLSN73L17B745U"
              value={form.partitaIva}
              onChange={(e) => update("partitaIva", e.target.value.toUpperCase())}
              style={{ width: "100%", padding: "0.85rem 1rem", background: "#131a14",
                border: "1px solid #2a3f2e", borderRadius: "0.6rem", color: "#f0f8f2",
                fontSize: "0.95rem", fontFamily: "monospace", outline: "none",
                boxSizing: "border-box" }}
            />
            <p style={{ fontSize: "0.75rem", color: "#6a8a72", marginTop: "0.4rem" }}>
              Accettiamo P.IVA (es. IT12345678901) o Codice Fiscale (16 caratteri). Usato solo per verificare l&apos;unicità della prova gratuita.
            </p>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: "0.4rem" }}>
              Insegna all&apos;AI la tua attività
            </h1>
            <p style={{ color: "#7a9b7e", fontSize: "0.88rem", marginBottom: "1.8rem" }}>
              Rispondi alle 3 domande — l&apos;AI userà queste info per rispondere ai clienti come una receptionist.
            </p>

            <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase",
              letterSpacing: "0.07em", color: "#7a9b7e", marginBottom: "0.5rem" }}>
              1. Quali servizi/prodotti offri? (con prezzi se disponibili) *
            </label>
            <textarea
              placeholder={"es.\n- Pizza margherita €8\n- Taglio uomo €15, donna €25\n- Visita medica €50\n- Lezione privata €30/h"}
              value={form.services} onChange={(e) => update("services", e.target.value)} rows={4}
              style={{ width: "100%", padding: "0.75rem 1rem", background: "#131a14",
                border: "1px solid #1e2b20", borderRadius: "0.6rem", color: "#e8f0e9",
                fontSize: "0.88rem", fontFamily: "inherit", lineHeight: 1.6, resize: "vertical",
                outline: "none", marginBottom: "1.2rem", boxSizing: "border-box" }} />

            <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase",
              letterSpacing: "0.07em", color: "#7a9b7e", marginBottom: "0.5rem" }}>
              2. Orari di apertura e come si prenota? *
            </label>
            <textarea
              placeholder={"es.\nLun–Ven: 9:00–19:00, Sab: 9:00–13:00, Dom: chiuso\nPrenotazioni: via Telegram o chiamando il 333-1234567\nDurata media appuntamento: 45 min"}
              value={form.openingHours} onChange={(e) => update("openingHours", e.target.value)}
              rows={4} style={{ width: "100%", padding: "0.75rem 1rem", background: "#131a14",
                border: "1px solid #1e2b20", borderRadius: "0.6rem", color: "#e8f0e9",
                fontSize: "0.88rem", fontFamily: "inherit", lineHeight: 1.6, resize: "vertical",
                outline: "none", marginBottom: "1.2rem", boxSizing: "border-box" }} />

            <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase",
              letterSpacing: "0.07em", color: "#7a9b7e", marginBottom: "0.5rem" }}>
              3. Indirizzo, come raggiungerci e note importanti (opzionale)
            </label>
            <textarea
              placeholder={"es.\nVia Roma 12, Milano — 50m dalla fermata metro Duomo\nParcheggio gratuito in Via Verdi\nAccettiamo carte e contanti\nPortare documento per la prima visita"}
              value={form.extraInfo} onChange={(e) => update("extraInfo", e.target.value)}
              rows={4} style={{ width: "100%", padding: "0.75rem 1rem", background: "#131a14",
                border: "1px solid #1e2b20", borderRadius: "0.6rem", color: "#e8f0e9",
                fontSize: "0.88rem", fontFamily: "inherit", lineHeight: 1.6, resize: "vertical",
                outline: "none", boxSizing: "border-box" }} />
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: "0.4rem" }}>
              Collega Google Calendar
            </h1>
            <p style={{ color: "#7a9b7e", fontSize: "0.88rem", marginBottom: "1.8rem" }}>
              RistoAgent verificherà la disponibilità e creerà prenotazioni automaticamente
              nel tuo calendario — senza che tu debba fare nulla.
            </p>
            {!googleConnected ? (
              <>
                <div style={{ background: "#131a14", border: "1px solid #1e2b20",
                  borderRadius: "0.8rem", padding: "1.2rem", marginBottom: "1.5rem" }}>
                  <p style={{ fontSize: "0.82rem", color: "#7a9b7e", marginBottom: "0.8rem" }}>
                    Cosa succede dopo il click:
                  </p>
                  {["Si apre Google per il login", "Autorizzi RistoAgent ad accedere al calendario",
                    "Torni qui con il calendario collegato"].map((text, i) => (
                    <div key={i} style={{ display: "flex", gap: "0.75rem",
                      alignItems: "flex-start", marginBottom: "0.5rem" }}>
                      <span style={{ minWidth: 20, height: 20, borderRadius: "50%",
                        background: "#0EA5E9", color: "#fff", fontSize: "0.65rem",
                        fontWeight: 700, display: "flex", alignItems: "center",
                        justifyContent: "center" }}>{i + 1}</span>
                      <p style={{ fontSize: "0.85rem", color: "#e8f0e9" }}>{text}</p>
                    </div>
                  ))}
                </div>
                <button onClick={handleConnectGoogle} style={{
                  width: "100%", padding: "0.85rem", background: "#0EA5E9", color: "#fff",
                  border: "none", borderRadius: "999px", fontSize: "0.95rem", fontWeight: 600,
                  fontFamily: "inherit", cursor: "pointer",
                }}>
                  🔗 Accedi con Google →
                </button>
              </>
            ) : (
              <div style={{ background: "rgba(14,165,233,0.1)", border: "1px solid #0EA5E9",
                borderRadius: "0.8rem", padding: "1.2rem", textAlign: "center" }}>
                <p style={{ fontSize: "1.5rem", marginBottom: "0.3rem" }}>✅</p>
                <p style={{ fontWeight: 600, color: "#0EA5E9" }}>Google Calendar collegato!</p>
                <p style={{ fontSize: "0.82rem", color: "#7a9b7e", marginTop: "0.3rem" }}>
                  Il tuo calendario è pronto per gestire le prenotazioni.
                </p>
              </div>
            )}
          </div>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: "0.4rem" }}>
              Crea il tuo Bot Telegram
            </h1>
            <p style={{ color: "#7a9b7e", fontSize: "0.88rem", marginBottom: "1.5rem" }}>
              Il bot è il canale tramite cui i tuoi clienti ti scriveranno. Crearlo è
              gratuito e richiede solo 2 minuti.
            </p>
            <div style={{ background: "#131a14", border: "1px solid #1e2b20",
              borderRadius: "0.8rem", padding: "1.2rem", marginBottom: "1.5rem" }}>
              <p style={{ fontSize: "0.78rem", color: "#0EA5E9", textTransform: "uppercase",
                letterSpacing: "0.07em", marginBottom: "1rem", fontWeight: 600 }}>
                Guida passo-passo
              </p>
              {[
                "Apri Telegram e cerca @BotFather",
                "Invia il comando: /newbot",
                "Scegli un nome per il bot (es. \"Trattoria da Mario\")",
                "Scegli uno username che finisca con \"bot\" (es. trattoria_mario_bot)",
                "Copia il token che BotFather ti invia e incollalo qui sotto",
              ].map((text, i) => (
                <div key={i} style={{ display: "flex", gap: "0.75rem",
                  alignItems: "flex-start", marginBottom: "0.75rem" }}>
                  <span style={{ minWidth: 22, height: 22, borderRadius: "50%",
                    background: "#0EA5E9", color: "#fff", fontSize: "0.7rem",
                    fontWeight: 700, display: "flex", alignItems: "center",
                    justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                  <p style={{ fontSize: "0.85rem", color: "#e8f0e9", lineHeight: 1.5 }}>{text}</p>
                </div>
              ))}
            </div>
            <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase",
              letterSpacing: "0.07em", color: "#7a9b7e", marginBottom: "0.5rem" }}>
              Token BotFather *
            </label>
            <input
              placeholder="1234567890:AAFabcdefghijklmnopqrstuvwxyz"
              value={form.telegramToken}
              onChange={(e) => update("telegramToken", e.target.value)}
              style={{ width: "100%", padding: "0.75rem 1rem", background: "#131a14",
                border: "1px solid #1e2b20", borderRadius: "0.6rem", color: "#e8f0e9",
                fontSize: "0.88rem", fontFamily: "monospace", outline: "none",
                boxSizing: "border-box" }} />
            <p style={{ fontSize: "0.78rem", color: "#7a9b7e", marginTop: "0.5rem" }}>
              🔒 Il token è salvato in modo sicuro e non viene mai condiviso.
            </p>
          </div>
        )}

        {/* STEP 5 */}
        {step === 5 && (
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: "0.4rem" }}>
              Tutto pronto! 🎉
            </h1>
            <p style={{ color: "#7a9b7e", fontSize: "0.88rem", marginBottom: "1.5rem" }}>
              RistoAgent è attivo. Scarica il QR code e condividilo ovunque.
            </p>
            <div style={{ background: "#131a14", border: "1px solid #1e2b20",
              borderRadius: "0.8rem", padding: "1.2rem", marginBottom: "1.5rem" }}>
              <p style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em",
                color: "#0EA5E9", marginBottom: "0.8rem" }}>Riepilogo</p>
              {[
                { label: "Attività", value: form.businessName },
                { label: "Bot Telegram", value: botUsername ? `@${botUsername}` : "—" },
                { label: "Google Calendar", value: googleConnected ? "Collegato ✓" : "—" },
              ].map((row) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between",
                  padding: "0.35rem 0", borderBottom: "1px solid #1e2b20", fontSize: "0.85rem" }}>
                  <span style={{ color: "#7a9b7e" }}>{row.label}</span>
                  <strong style={{ color: "#e8f0e9", fontWeight: 400 }}>{row.value}</strong>
                </div>
              ))}
            </div>
            {qrDataUrl && (
              <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                <img src={qrDataUrl} alt="QR Code" style={{ width: 160, height: 160,
                  borderRadius: "0.8rem", background: "#fff", padding: "0.5rem" }} />
                <p style={{ fontSize: "0.78rem", color: "#7a9b7e", margin: "0.5rem 0" }}>
                  Usa questo QR su social, volantini e vetrina
                </p>
                <button onClick={downloadQR} style={{
                  padding: "0.5rem 1.2rem", background: "transparent",
                  border: "1px solid #0EA5E9", borderRadius: "999px",
                  color: "#0EA5E9", fontSize: "0.85rem", fontFamily: "inherit", cursor: "pointer",
                }}>
                  ⬇ Scarica QR Code PNG
                </button>
              </div>
            )}
            <button onClick={() => router.push("/dashboard")} style={{
              width: "100%", padding: "0.85rem", background: "#0EA5E9", color: "#fff",
              border: "none", borderRadius: "999px", fontSize: "0.95rem", fontWeight: 600,
              fontFamily: "inherit", cursor: "pointer",
            }}>
              Vai alla Dashboard →
            </button>
          </div>
        )}

        {/* Actions */}
        {step < 5 && (
          <div style={{ display: "flex", gap: "0.8rem", marginTop: "2rem", alignItems: "center" }}>
            {step > 1 && (
              <button onClick={() => setStep((s) => s - 1)} style={{
                background: "transparent", border: "1px solid #1e2b20", borderRadius: "999px",
                color: "#7a9b7e", fontSize: "0.88rem", fontFamily: "inherit",
                padding: "0.75rem 1.2rem", cursor: "pointer",
              }}>
                ← Indietro
              </button>
            )}
            <button
              onClick={() => {
                if (step === 1) handleCheckPivaAndProceed();
                else if (step === 2) handleSaveStep2();
                else if (step === 4) handleSaveTelegramToken();
                else setStep((s) => s + 1);
              }}
              disabled={!canProceed() || loading}
              style={{
                flex: 1, background: "#0EA5E9", color: "#fff", border: "none",
                borderRadius: "999px", fontSize: "0.95rem", fontWeight: 500,
                fontFamily: "inherit", padding: "0.85rem 1.5rem", cursor: "pointer",
                opacity: !canProceed() || loading ? 0.35 : 1, transition: "opacity 0.2s",
              }}
            >
              {loading ? "Salvataggio..." : step === 4 ? "Attiva bot →" : "Continua →"}
            </button>
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
