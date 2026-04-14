"use client";

import { useState } from "react";

const RESTAURANT_TYPES = [
  "Fine Dining",
  "Casual Bistro",
  "Fast Casual",
  "Café & Bakery",
  "Pizza & Italian",
  "Sushi & Japanese",
  "Mexican & Tex-Mex",
  "Steakhouse",
  "Seafood",
  "Vegan & Vegetarian",
  "Food Truck",
  "Bar & Gastropub",
  "Other",
];

const GOALS = [
  { id: "bookings", label: "Increase bookings", icon: "📅" },
  { id: "time", label: "Save time on operations", icon: "⏱️" },
  { id: "reviews", label: "Improve guest reviews", icon: "⭐" },
  { id: "upsell", label: "Boost average check", icon: "💰" },
  { id: "staff", label: "Streamline staff coordination", icon: "👥" },
  { id: "menu", label: "Optimize menu performance", icon: "📊" },
];

export default function RistoAgentOnboarding() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({ name: "", type: "", goal: "" });
  const [done, setDone] = useState(false);
  const [direction, setDirection] = useState("forward");

  const goNext = () => {
    setDirection("forward");
    if (step < 3) setStep((s) => s + 1);
    else {
      if (typeof window !== "undefined") {
        localStorage.setItem("ristoagent_onboarding", JSON.stringify(data));
      }
      setDone(true);
    }
  };

  const goBack = () => {
    setDirection("back");
    setStep((s) => s - 1);
  };

  const canProceed =
    (step === 1 && data.name.trim().length > 0) ||
    (step === 2 && data.type !== "") ||
    (step === 3 && data.goal !== "");

  if (done) {
    return (
      <div style={styles.root}>
        <div style={styles.card}>
          <div style={styles.successIcon}>🎉</div>
          <h2 style={styles.successTitle}>You're all set, {data.name}!</h2>
          <p style={styles.successSub}>
            RistoAgent is ready to help your {data.type.toLowerCase()} reach its
            full potential.
          </p>
          <div style={styles.summaryBox}>
            <div style={styles.summaryRow}>
              <span style={styles.summaryLabel}>Restaurant</span>
              <span style={styles.summaryValue}>{data.name}</span>
            </div>
            <div style={styles.summaryRow}>
              <span style={styles.summaryLabel}>Type</span>
              <span style={styles.summaryValue}>{data.type}</span>
            </div>
            <div style={styles.summaryRow}>
              <span style={styles.summaryLabel}>Goal</span>
              <span style={styles.summaryValue}>
                {GOALS.find((g) => g.id === data.goal)?.label}
              </span>
            </div>
          </div>
          <button style={styles.primaryBtn} onClick={() => {}}>
            Open Dashboard →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      {/* Progress bar */}
      <div style={styles.progressWrap}>
        <div style={{ ...styles.progressBar, width: `${(step / 3) * 100}%` }} />
      </div>

      <div style={styles.card}>
        {/* Step indicator */}
        <div style={styles.stepDots}>
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              style={{
                ...styles.dot,
                ...(n === step ? styles.dotActive : {}),
                ...(n < step ? styles.dotDone : {}),
              }}
            >
              {n < step ? "✓" : n}
            </div>
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div style={styles.stepContent}>
            <p style={styles.eyebrow}>Step 1 of 3</p>
            <h1 style={styles.heading}>What's your restaurant called?</h1>
            <p style={styles.sub}>This is how RistoAgent will refer to your place.</p>
            <input
              style={styles.input}
              type="text"
              placeholder="e.g. Trattoria Bella"
              value={data.name}
              autoFocus
              onChange={(e) => setData({ ...data, name: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && canProceed && goNext()}
            />
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div style={styles.stepContent}>
            <p style={styles.eyebrow}>Step 2 of 3</p>
            <h1 style={styles.heading}>What type of restaurant is it?</h1>
            <p style={styles.sub}>Helps us tailor your experience from day one.</p>
            <div style={styles.selectWrap}>
              <select
                style={styles.select}
                value={data.type}
                onChange={(e) => setData({ ...data, type: e.target.value })}
                autoFocus
              >
                <option value="" disabled>
                  Choose a category…
                </option>
                {RESTAURANT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <span style={styles.selectChevron}>▾</span>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div style={styles.stepContent}>
            <p style={styles.eyebrow}>Step 3 of 3</p>
            <h1 style={styles.heading}>What's your main goal?</h1>
            <p style={styles.sub}>We'll focus RistoAgent on what matters most to you.</p>
            <div style={styles.goalGrid}>
              {GOALS.map((g) => (
                <button
                  key={g.id}
                  style={{
                    ...styles.goalBtn,
                    ...(data.goal === g.id ? styles.goalBtnActive : {}),
                  }}
                  onClick={() => setData({ ...data, goal: g.id })}
                >
                  <span style={styles.goalIcon}>{g.icon}</span>
                  <span style={styles.goalLabel}>{g.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={styles.nav}>
          {step > 1 ? (
            <button style={styles.backBtn} onClick={goBack}>
              ← Back
            </button>
          ) : (
            <div />
          )}
          <button
            style={{
              ...styles.primaryBtn,
              opacity: canProceed ? 1 : 0.4,
              cursor: canProceed ? "pointer" : "not-allowed",
            }}
            onClick={goNext}
            disabled={!canProceed}
          >
            {step === 3 ? "Finish →" : "Continue →"}
          </button>
        </div>
      </div>

      <p style={styles.footer}>No credit card required · Cancel anytime</p>
    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────── */
const ACCENT = "#E8441A";
const ACCENT_DARK = "#C93510";
const BG = "#FAF8F5";
const CARD_BG = "#FFFFFF";
const TEXT = "#1A1714";
const MUTED = "#8A8480";
const BORDER = "#E8E4DF";

const styles = {
  root: {
    minHeight: "100vh",
    background: BG,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    padding: "24px 16px",
    boxSizing: "border-box",
  },
  progressWrap: {
    width: "100%",
    maxWidth: 480,
    height: 3,
    background: BORDER,
    borderRadius: 99,
    marginBottom: 32,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    background: ACCENT,
    borderRadius: 99,
    transition: "width 0.4s ease",
  },
  card: {
    width: "100%",
    maxWidth: 480,
    background: CARD_BG,
    borderRadius: 20,
    padding: "40px 40px 32px",
    boxShadow: "0 2px 24px rgba(0,0,0,0.07)",
    boxSizing: "border-box",
  },
  stepDots: {
    display: "flex",
    gap: 8,
    marginBottom: 32,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: BORDER,
    color: MUTED,
    fontSize: 12,
    fontFamily: "monospace",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 600,
    transition: "all 0.25s",
  },
  dotActive: {
    background: ACCENT,
    color: "#fff",
  },
  dotDone: {
    background: "#D4EDD4",
    color: "#2A7A2A",
  },
  stepContent: {
    marginBottom: 32,
  },
  eyebrow: {
    fontFamily: "'Courier New', monospace",
    fontSize: 11,
    letterSpacing: "0.12em",
    color: ACCENT,
    textTransform: "uppercase",
    margin: "0 0 12px",
  },
  heading: {
    fontSize: 26,
    fontWeight: 700,
    color: TEXT,
    margin: "0 0 8px",
    lineHeight: 1.2,
    fontFamily: "'Georgia', serif",
  },
  sub: {
    fontSize: 14,
    color: MUTED,
    margin: "0 0 24px",
    lineHeight: 1.5,
    fontFamily: "'Georgia', serif",
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    fontSize: 16,
    border: `1.5px solid ${BORDER}`,
    borderRadius: 12,
    outline: "none",
    color: TEXT,
    background: BG,
    boxSizing: "border-box",
    fontFamily: "'Georgia', serif",
    transition: "border-color 0.2s",
  },
  selectWrap: {
    position: "relative",
    width: "100%",
  },
  select: {
    width: "100%",
    padding: "14px 40px 14px 16px",
    fontSize: 15,
    border: `1.5px solid ${BORDER}`,
    borderRadius: 12,
    outline: "none",
    color: TEXT,
    background: BG,
    boxSizing: "border-box",
    appearance: "none",
    fontFamily: "'Georgia', serif",
    cursor: "pointer",
  },
  selectChevron: {
    position: "absolute",
    right: 16,
    top: "50%",
    transform: "translateY(-50%)",
    color: MUTED,
    pointerEvents: "none",
    fontSize: 14,
  },
  goalGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
  goalBtn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    padding: "14px 14px",
    border: `1.5px solid ${BORDER}`,
    borderRadius: 12,
    background: BG,
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.18s",
  },
  goalBtnActive: {
    border: `1.5px solid ${ACCENT}`,
    background: "#FFF3EF",
  },
  goalIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  goalLabel: {
    fontSize: 13,
    color: TEXT,
    fontFamily: "'Georgia', serif",
    fontWeight: 500,
    lineHeight: 1.3,
  },
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backBtn: {
    background: "none",
    border: "none",
    color: MUTED,
    fontSize: 14,
    cursor: "pointer",
    padding: "10px 0",
    fontFamily: "'Georgia', serif",
  },
  primaryBtn: {
    background: ACCENT,
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "14px 28px",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'Georgia', serif",
    transition: "background 0.18s",
  },
  // Success screen
  successIcon: {
    fontSize: 48,
    textAlign: "center",
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: 700,
    color: TEXT,
    textAlign: "center",
    margin: "0 0 8px",
    fontFamily: "'Georgia', serif",
  },
  successSub: {
    fontSize: 14,
    color: MUTED,
    textAlign: "center",
    margin: "0 0 28px",
    fontFamily: "'Georgia', serif",
  },
  summaryBox: {
    background: BG,
    borderRadius: 12,
    padding: "16px 20px",
    marginBottom: 28,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 12,
    color: MUTED,
    fontFamily: "'Courier New', monospace",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  summaryValue: {
    fontSize: 14,
    color: TEXT,
    fontWeight: 600,
    fontFamily: "'Georgia', serif",
  },
  footer: {
    marginTop: 20,
    fontSize: 12,
    color: MUTED,
    fontFamily: "'Courier New', monospace",
  },
};
