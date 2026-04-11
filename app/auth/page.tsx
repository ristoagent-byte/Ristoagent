"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const supabase = getSupabaseBrowser();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

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
      options: { redirectTo: `${window.location.origin}/onboarding` },
    });
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at top, #0f1f2e 0%, #0a0f0d 60%)",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "2rem 1rem",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: "#e8f0e9",
    }}>
      <a href="/" style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0EA5E9",
        textDecoration: "none", marginBottom: "2rem", letterSpacing: "-0.02em" }}>
        RistoAgent
      </a>

      <div style={{
        background: "#0f1610", border: "1px solid #1e2b20", borderRadius: "1.2rem",
        padding: "2.5rem 2rem", width: "100%", maxWidth: "420px",
        boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
      }}>
        <div style={{ display: "flex", marginBottom: "2rem", background: "#131a14",
          borderRadius: "0.8rem", padding: "4px" }}>
          {(["login", "register"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: "0.6rem", borderRadius: "0.6rem", border: "none",
              cursor: "pointer", fontFamily: "inherit", fontSize: "0.9rem", fontWeight: 500,
              transition: "all 0.2s",
              background: mode === m ? "#0EA5E9" : "transparent",
              color: mode === m ? "#fff" : "#7a9b7e",
            }}>
              {m === "login" ? "Accedi" : "Registrati"}
            </button>
          ))}
        </div>

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
              marginBottom: "1rem", boxSizing: "border-box" }}
          />
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

          {error && (
            <p style={{ color: "#ff6b6b", fontSize: "0.85rem", marginBottom: "1rem" }}>{error}</p>
          )}

          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "0.85rem", background: "#0EA5E9", color: "#fff",
            border: "none", borderRadius: "999px", fontSize: "0.95rem", fontWeight: 600,
            fontFamily: "inherit", cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1, marginBottom: "1rem",
          }}>
            {loading ? "..." : mode === "login" ? "Accedi →" : "Crea account →"}
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
      </div>
    </div>
  );
}
