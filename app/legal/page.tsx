import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Note legali — RistoAgent",
  description: "Informazioni legali, dati societari e contatti di RistoAgent.",
};

export default function LegalPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#111a13",
      color: "#e8f0e9",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      padding: "6rem 1.5rem 4rem",
    }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <a href="/" style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem",
          fontWeight: 700, color: "#BAE6FD", textDecoration: "none", display: "block",
          marginBottom: "3rem" }}>
          Risto<span style={{ color: "#0EA5E9" }}>Agent</span>
        </a>

        <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem",
          letterSpacing: "-0.02em" }}>Note legali</h1>
        <p style={{ color: "#7a9b7e", marginBottom: "3rem", fontSize: "0.9rem" }}>
          Informazioni societarie ai sensi del D.Lgs. 70/2003 e del Regolamento UE 2016/679 (GDPR)
        </p>

        <section style={{ marginBottom: "2.5rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#0EA5E9",
            textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "1.2rem" }}>
            Titolare del servizio
          </h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            {[
              ["Ragione sociale", "Alessandro Bernabé"],
              ["Forma giuridica", "Imprenditore individuale (OSVČ)"],
              ["Sede legale", "Žatecká 41/4, Staré Město, 110 00 Praha 1, Repubblica Ceca"],
              ["IČO (Reg. imprese)", "06043194"],
              ["DIČ (Partita IVA)", "CZ684205475"],
              ["Sito web", "ristoagent.com"],
            ].map(([label, value]) => (
              <tr key={label} style={{ borderBottom: "1px solid #1e2b20" }}>
                <td style={{ padding: "0.75rem 0", color: "#7a9b7e", width: "40%" }}>{label}</td>
                <td style={{ padding: "0.75rem 0", color: "#e8f0e9" }}>{value}</td>
              </tr>
            ))}
          </table>
        </section>

        <section style={{ marginBottom: "2.5rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#0EA5E9",
            textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "1rem" }}>
            Trattamento dei dati personali
          </h2>
          <p style={{ color: "#7a9b7e", fontSize: "0.88rem", lineHeight: 1.8 }}>
            RistoAgent tratta i dati personali degli utenti (email, dati di accesso, informazioni
            sull&apos;attività) esclusivamente per erogare il servizio. I dati sono conservati su
            infrastrutture sicure (Supabase/Vercel) con sede nell&apos;Unione Europea e non vengono
            ceduti a terzi. L&apos;utente può richiedere in qualsiasi momento la cancellazione del
            proprio account e dei relativi dati scrivendo a:{" "}
            <a href="mailto:privacy@ristoagent.com" style={{ color: "#0EA5E9" }}>
              privacy@ristoagent.com
            </a>
          </p>
        </section>

        <section style={{ marginBottom: "2.5rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#0EA5E9",
            textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "1rem" }}>
            Contatti
          </h2>
          <p style={{ color: "#7a9b7e", fontSize: "0.88rem", lineHeight: 1.8 }}>
            Per qualsiasi richiesta legale o relativa alla privacy:{" "}
            <a href="mailto:info@ristoagent.com" style={{ color: "#0EA5E9" }}>
              info@ristoagent.com
            </a>
          </p>
        </section>

        <p style={{ fontSize: "0.75rem", color: "#3a5c3e", marginTop: "4rem" }}>
          Ultimo aggiornamento: aprile 2026
        </p>
      </div>
    </div>
  );
}
