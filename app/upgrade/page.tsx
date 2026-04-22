"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

const FOUNDING_SLOTS = 20;

const foundingPlans = [
  {
    id: "founding_starter",
    name: "Starter",
    price: "19",
    wasPrice: "29",
    billingNote: "Rinnovo mensile · Prezzo bloccato per sempre",
    desc: "Per attività con clienti abituali.",
    features: ["300 operazioni/mese", "1 Bot Telegram", "Google Calendar", "FAQ automatiche"],
    featured: false,
  },
  {
    id: "founding_pro",
    name: "Pro",
    price: "29",
    wasPrice: "49",
    billingNote: "Rinnovo mensile · Prezzo bloccato per sempre",
    desc: "Per attività in crescita, senza limiti.",
    features: ["Operazioni illimitate", "1 Bot Telegram", "Google Calendar", "Analisi e report", "Supporto prioritario"],
    featured: true,
  },
];

const plans = [
  {
    id: "flexible",
    name: "Flessibile",
    price: "39",
    billingNote: "Nessun rinnovo automatico",
    desc: "Paghi solo i mesi in cui lo usi.",
    features: ["500 operazioni/mese", "1 Bot Telegram", "Google Calendar", "FAQ automatiche"],
    featured: false,
  },
  {
    id: "starter",
    name: "Starter",
    price: "29",
    billingNote: "Rinnovo mensile automatico",
    desc: "Per attività con clienti abituali.",
    features: ["300 operazioni/mese", "1 Bot Telegram", "Google Calendar", "FAQ automatiche"],
    featured: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "49",
    billingNote: "Rinnovo mensile automatico",
    desc: "Per attività in crescita, senza limiti.",
    features: ["Operazioni illimitate", "1 Bot Telegram", "Google Calendar", "Analisi e report", "Supporto prioritario"],
    featured: true,
  },
];

export default function UpgradePage() {
  const router = useRouter();
  const supabase = getSupabaseBrowser();
  const [loading, setLoading] = useState<string | null>(null);
  const [trialExpired, setTrialExpired] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [foundingSlotsTaken, setFoundingSlotsTaken] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push("/auth"); return; }
      const { data: biz } = await supabase
        .from("businesses").select("plan").eq("user_id", data.user.id).single();
      const plan = (biz as { plan?: string } | null)?.plan;
      if (plan) setCurrentPlan(plan);
    });
    // Conta posti founding members già occupati
    supabase
      .from("businesses")
      .select("id", { count: "exact" })
      .in("plan", ["founding_starter", "founding_pro"])
      .then(({ count }) => setFoundingSlotsTaken(count ?? 0));
    const expired = new URLSearchParams(window.location.search).get("expired");
    if (expired === "1") setTrialExpired(true);
  }, []);

  async function handleChoosePlan(planId: string) {
    setLoading(planId);
    const { data } = await supabase.auth.getUser();
    if (!data.user) { router.push("/auth"); return; }

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId, userId: data.user.id }),
    });
    const json = await res.json();
    if (json.url) {
      window.location.href = json.url;
    } else {
      alert(json.error ?? "Errore durante il checkout");
      setLoading(null);
    }
  }

  const card: React.CSSProperties = {
    background: "#111a15", border: "1px solid #1a2620", borderRadius: 16, padding: "2rem 1.8rem",
    position: "relative", flex: "1 1 240px", maxWidth: 320,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#111a13",
      fontFamily: "'DM Sans','Segoe UI',sans-serif", color: "#e9edef",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "4rem 1.5rem" }}>

      <a href="/" style={{ textDecoration: "none", marginBottom: "2.5rem" }}>
        <img src="/logo.png" alt="RistoAgent" style={{ height: 64, width: "auto" }} />
      </a>

      {trialExpired && (
        <div style={{ background: "rgba(255,107,107,0.08)", border: "1px solid #ff6b6b",
          borderRadius: 12, padding: "1rem 1.5rem", marginBottom: "2rem",
          maxWidth: 700, width: "100%", textAlign: "center" }}>
          <p style={{ color: "#ff6b6b", fontWeight: 600, marginBottom: "0.3rem" }}>
            La tua prova gratuita è terminata.
          </p>
          <p style={{ fontSize: "0.85rem", color: "#7a9b7e" }}>
            Scegli un piano per continuare a usare RistoAgent.
          </p>
        </div>
      )}

      {currentPlan && (
        <div style={{ background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.3)",
          borderRadius: 10, padding: "0.6rem 1.2rem", marginBottom: "2rem", fontSize: "0.85rem", color: "#7dd3fc" }}>
          Piano attuale: <strong style={{ color: "#e0f2fe" }}>
            {currentPlan === "trial" ? "Prova gratuita" : currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
          </strong>
        </div>
      )}

      <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem",
        letterSpacing: "-0.02em", textAlign: "center" }}>
        Scegli il tuo piano
      </h1>
      <p style={{ color: "#7a9b7e", marginBottom: "3rem", textAlign: "center" }}>
        Disdici quando vuoi · Assistenza inclusa
      </p>

      {/* ── Founding Members ── */}
      {foundingSlotsTaken < FOUNDING_SLOTS && (
        <div style={{ maxWidth: 720, width: "100%", marginBottom: "3rem" }}>
          <div style={{ background: "linear-gradient(135deg,#1a0f00,#0f0a00)", border: "1px solid #f97316",
            borderRadius: 16, padding: "1.5rem 2rem", marginBottom: "1.5rem", textAlign: "center" }}>
            <p style={{ color: "#f97316", fontWeight: 700, fontSize: "0.75rem",
              textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.3rem" }}>
              🔥 Offerta Founding Members
            </p>
            <p style={{ color: "#fde68a", fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.3rem" }}>
              Prezzi bloccati per sempre — solo per i primi {FOUNDING_SLOTS} clienti
            </p>
            <p style={{ color: "#92400e", fontSize: "0.82rem" }}>
              {FOUNDING_SLOTS - foundingSlotsTaken} posti rimasti su {FOUNDING_SLOTS}
            </p>
          </div>

          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", justifyContent: "center" }}>
            {foundingPlans.map((plan) => {
              const isCurrent = currentPlan === plan.id;
              return (
                <div key={plan.id} style={{
                  ...card,
                  flex: "1 1 280px", maxWidth: 340,
                  border: isCurrent ? "2px solid #22c55e" : plan.featured ? "1px solid #f97316" : "1px solid #3d2200",
                  background: plan.featured ? "linear-gradient(145deg,#1a0f00,#0f0a00)" : "#110c00",
                }}>
                  {isCurrent && (
                    <span style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                      background: "#22c55e", color: "#111a13", fontSize: "0.7rem", fontWeight: 700,
                      padding: "0.2rem 0.8rem", borderRadius: 999, textTransform: "uppercase",
                      letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                      ✓ Piano attuale
                    </span>
                  )}
                  {!isCurrent && plan.featured && (
                    <span style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                      background: "#f97316", color: "#fff", fontSize: "0.7rem", fontWeight: 600,
                      padding: "0.2rem 0.8rem", borderRadius: 999, textTransform: "uppercase",
                      letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                      Consigliato
                    </span>
                  )}
                  <p style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em",
                    color: "#f97316", marginBottom: "0.8rem" }}>{plan.name}</p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.2rem" }}>
                    <p style={{ fontSize: "2.8rem", fontWeight: 700, fontFamily: "monospace", lineHeight: 1 }}>
                      €{plan.price}<span style={{ fontSize: "1rem", color: "#7a9b7e", fontFamily: "inherit", fontWeight: 400 }}>/mese</span>
                    </p>
                    <p style={{ fontSize: "1rem", color: "#4b2e00", textDecoration: "line-through" }}>€{plan.wasPrice}</p>
                  </div>
                  <p style={{ fontSize: "0.72rem", color: "#f97316", marginBottom: "0.6rem" }}>
                    {plan.billingNote}
                  </p>
                  <p style={{ fontSize: "0.84rem", color: "#7a9b7e", marginBottom: "1.5rem" }}>{plan.desc}</p>
                  <ul style={{ listStyle: "none", padding: 0, marginBottom: "2rem" }}>
                    {plan.features.map((f) => (
                      <li key={f} style={{ fontSize: "0.85rem", color: "#e9edef",
                        padding: "0.35rem 0", borderBottom: "1px solid #3d2200",
                        display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ color: "#f97316", fontSize: "0.7rem" }}>✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => !isCurrent && handleChoosePlan(plan.id)}
                    disabled={loading === plan.id || isCurrent}
                    style={{ width: "100%", padding: "0.85rem",
                      background: isCurrent ? "#0d2010" : "#f97316",
                      border: isCurrent ? "1px solid #22c55e" : "none",
                      borderRadius: 999,
                      color: isCurrent ? "#22c55e" : "#fff",
                      fontSize: "0.95rem", fontWeight: 600, fontFamily: "inherit",
                      cursor: isCurrent ? "default" : "pointer",
                      opacity: loading === plan.id ? 0.6 : 1 }}>
                    {loading === plan.id ? "..." : isCurrent ? "Piano attivo" : `Scegli Founding ${plan.name} →`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <h2 style={{ fontSize: "0.8rem", fontWeight: 600, color: "#7a9b7e", marginBottom: "1.5rem",
        textAlign: "center", letterSpacing: "0.05em", textTransform: "uppercase" }}>
        {foundingSlotsTaken < FOUNDING_SLOTS ? "— Piani standard —" : "Scegli il tuo piano"}
      </h2>

      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", justifyContent: "center",
        maxWidth: 1020, width: "100%" }}>
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          return (
            <div key={plan.id} style={{
              ...card,
              border: isCurrent ? "2px solid #22c55e" : plan.featured ? "1px solid #0EA5E9" : "1px solid #1a2620",
              background: plan.featured ? "linear-gradient(145deg,#1c2a1e,#172019)" : "#111a15",
            }}>
              {isCurrent && (
                <span style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                  background: "#22c55e", color: "#111a13", fontSize: "0.7rem", fontWeight: 700,
                  padding: "0.2rem 0.8rem", borderRadius: 999, textTransform: "uppercase",
                  letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                  ✓ Piano attuale
                </span>
              )}
              {!isCurrent && plan.featured && (
                <span style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                  background: "#0EA5E9", color: "#111a13", fontSize: "0.7rem", fontWeight: 600,
                  padding: "0.2rem 0.8rem", borderRadius: 999, textTransform: "uppercase",
                  letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                  Più popolare
                </span>
              )}
              <p style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em",
                color: "#7a9b7e", marginBottom: "0.8rem" }}>{plan.name}</p>
              <p style={{ fontSize: "2.8rem", fontWeight: 700, fontFamily: "monospace",
                lineHeight: 1, marginBottom: "0.2rem" }}>
                €{plan.price}<span style={{ fontSize: "1rem", color: "#7a9b7e", fontFamily: "inherit",
                  fontWeight: 400 }}>/mese</span>
              </p>
              <p style={{ fontSize: "0.72rem", color: "#4ade80", marginBottom: "0.6rem" }}>
                {plan.billingNote}
              </p>
              <p style={{ fontSize: "0.84rem", color: "#7a9b7e", marginBottom: "1.5rem" }}>{plan.desc}</p>
              <ul style={{ listStyle: "none", padding: 0, marginBottom: "2rem" }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ fontSize: "0.85rem", color: "#e9edef",
                    padding: "0.35rem 0", borderBottom: "1px solid #1a2620",
                    display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ color: "#0EA5E9", fontSize: "0.7rem" }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => !isCurrent && handleChoosePlan(plan.id)}
                disabled={loading === plan.id || isCurrent}
                style={{ width: "100%", padding: "0.85rem",
                  background: isCurrent ? "#0d2010" : plan.featured ? "#0EA5E9" : "transparent",
                  border: isCurrent ? "1px solid #22c55e" : plan.featured ? "none" : "1px solid #1a2620",
                  borderRadius: 999,
                  color: isCurrent ? "#22c55e" : plan.featured ? "#fff" : "#7a9b7e",
                  fontSize: "0.95rem", fontWeight: 600, fontFamily: "inherit",
                  cursor: isCurrent ? "default" : "pointer",
                  opacity: loading === plan.id ? 0.6 : 1 }}>
                {loading === plan.id ? "..." : isCurrent ? "Piano attivo" : `Scegli ${plan.name} →`}
              </button>
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: "0.78rem", color: "#3a5c3e", marginTop: "3rem", textAlign: "center" }}>
        Hai domande?{" "}
        <a href="mailto:info@ristoagent.com" style={{ color: "#0EA5E9" }}>info@ristoagent.com</a>
      </p>
    </div>
  );
}
