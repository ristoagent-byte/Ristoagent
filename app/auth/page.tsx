"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

type Mode = "login" | "register" | "magic";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  const supabase = getSupabaseBrowser();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (mode === "magic") {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      setLoading(false);
      if (error) { setError(error.message); return; }
      setMagicSent(true);
      return;
    }

    if (mode === "register") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) { setError(error.message); setLoading(false); return; }
      router.push("/onboarding");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); setLoading(false); return; }
      router.push("/dashboard");
    }
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: "select_account" },
      },
    });
  }

  const tabs: { id: Mode; label: string }[] = [
    { id: "login", label: "Accedi" },
    { id: "register", label: "Registrati" },
    { id: "magic", label: "✉️ Link email" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at top, #0f1f2e 0%, #0a0f0d 60%)",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "2rem 1rem",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: "#e8f0e9",
    }}>
      <a href="/" style={{ textDecoration: "none", marginBottom: "2rem" }}>
        <img src="/logo.png" alt="RistoAgent" style={{ height: 44, width: "auto" }} />
      </a>

      <div style={{
        background: "#0f1610", border: "1px solid #1e2b20", borderRadius: "1.2rem",
        padding: "2.5rem 2rem", width: "100%", maxWidth: "420px",
        boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
      }}>
        {/* Tabs */}
        <div style={{ display: "flex", marginBottom: "2rem", background: "#131a14",
          borderRadius: "0.8rem", padding: "4px", gap: "2px" }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => { setMode(t.id); setError(""); setMagicSent(false); }} style={{
              flex: 1, padding: "0.6rem 0.3rem", borderRadius: "0.6rem", border: "none",
              cursor: "pointer", fontFamily: "inherit", fontSize: "0.82rem", fontWeight: 500,
              transition: "all 0.2s",
              background: mode === t.id ? "#0EA5E9" : "transparent",
              color: mode === t.id ? "#fff" : "#7a9b7e",
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Magic link sent confirmation */}
        {magicSent ? (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📬</div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.5rem" }}>
              Controlla la tua email
            </h2>
            <p style={{ color: "#7a9b7e", fontSize: "0.88rem", lineHeight: 1.6 }}>
              Abbiamo inviato un link di accesso a<br />
              <strong style={{ color: "#e8f0e9" }}>{email}</strong>.<br /><br />
              Clicca il link nell&apos;email per accedere.<br />
              Il link scade dopo 1 ora.
            </p>
            <button
              onClick={() => { setMagicSent(false); setEmail(""); }}
              style={{ marginTop: "1.5rem", background: "transparent", border: "none",
                color: "#0EA5E9", cursor: "pointer", fontSize: "0.85rem", fontFamily: "inherit" }}
            >
              ← Usa un&apos;altra email
            </button>
          </div>
        ) : (
          <>
            {mode === "magic" && (
              <p style={{ color: "#7a9b7e", fontSize: "0.85rem", marginBottom: "1.2rem", lineHeight: 1.5 }}>
                Inserisci la tua email — ti mandiamo un link per accedere direttamente. Nessuna password richiesta.
              </p>
            )}

            <form onSubmit={handleSubmit}>
              <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase",
                letterSpacing: "0.07em", color: "#7a9b7e", marginBottom: "0.5rem" }}>
                Email
              </label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                style={{ width: "100%", padding: "0.75rem 1rem", background: "#131a14",
                  border: "1px solid #1e2b20", borderRadius: "0.6rem", color: "#e8f0e9",
                  fontSize: "0.95rem", fontFamily: "inherit", outline: "none",
                  marginBottom: mode === "magic" ? "1.5rem" : "1rem", boxSizing: "border-box" }}
              />

              {mode !== "magic" && (
                <>
                  <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase",
                    letterSpacing: "0.07em", color: "#7a9b7e", marginBottom: "0.5rem" }}>
                    Password
                  </label>
                  <input
                    type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                    style={{ width: "100%", padding: "0.75rem 1rem", background: "#131a14",
                      border: "1px solid #1e2b20", borderRadius: "0.6rem", color: "#e8f0e9",
                      fontSize: "0.95rem", fontFamily: "inherit", outline: "none",
                      marginBottom: "1.5rem", boxSizing: "border-box" }}
                  />
                </>
              )}

              {error && (
                <p style={{ color: "#ff6b6b", fontSize: "0.85rem", marginBottom: "1rem" }}>{error}</p>
              )}

              <button type="submit" disabled={loading} style={{
                width: "100%", padding: "0.85rem", background: "#0EA5E9", color: "#fff",
                border: "none", borderRadius: "999px", fontSize: "0.95rem", fontWeight: 600,
                fontFamily: "inherit", cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1, marginBottom: "1rem",
              }}>
                {loading ? "..." : mode === "login" ? "Accedi →" : mode === "register" ? "Crea account →" : "Invia link →"}
              </button>
            </form>

            <div style={{ textAlign: "center", color: "#7a9b7e", fontSize: "0.85rem",
              marginBottom: "1rem" }}>oppure</div>

            <button onClick={handleGoogleLogin} style={{
              width: "100%", padding: "0.85rem", background: "#131a14",
              border: "1px solid #1e2b20", borderRadius: "999px", color: "#e8f0e9",
              fontSize: "0.9rem", fontFamily: "inherit", cursor: "pointer",
            }}>
              🔐 Continua con Google
            </button>
          </>
        )}
      </div>
    </div>
  );
}
