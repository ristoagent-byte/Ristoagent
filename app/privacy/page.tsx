import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — RistoAgent",
  description: "Informativa sul trattamento dei dati personali di RistoAgent ai sensi del GDPR.",
};

const Section = ({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) => (
  <section id={id} style={{ marginBottom: "2.5rem" }}>
    <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#0EA5E9",
      textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "1rem" }}>
      {title}
    </h2>
    {children}
  </section>
);

const p: React.CSSProperties = { color: "#7a9b7e", fontSize: "0.88rem", lineHeight: 1.9, marginBottom: "0.8rem" };
const li: React.CSSProperties = { ...p, marginBottom: "0.4rem" };

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#111a13", color: "#e8f0e9",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif", padding: "6rem 1.5rem 4rem" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <a href="/" style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem",
          fontWeight: 700, color: "#BAE6FD", textDecoration: "none", display: "block", marginBottom: "3rem" }}>
          Risto<span style={{ color: "#0EA5E9" }}>Agent</span>
        </a>

        <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem", letterSpacing: "-0.02em" }}>
          Privacy Policy
        </h1>
        <p style={{ color: "#7a9b7e", marginBottom: "3rem", fontSize: "0.9rem" }}>
          Informativa ai sensi dell&apos;art. 13 del Regolamento UE 2016/679 (GDPR) — Ultimo aggiornamento: aprile 2026
        </p>

        <Section title="Titolare del trattamento">
          <p style={p}>
            Alessandro Bernabé — OSVČ (Imprenditore individuale)<br />
            Žatecká 41/4, Staré Město, 110 00 Praha 1, Repubblica Ceca<br />
            IČO: 06043194 · DIČ: CZ684205475<br />
            Email: <a href="mailto:privacy@ristoagent.com" style={{ color: "#0EA5E9" }}>privacy@ristoagent.com</a>
          </p>
        </Section>

        <Section title="Dati raccolti e finalità">
          <p style={p}>RistoAgent raccoglie e tratta le seguenti categorie di dati:</p>
          <ul style={{ paddingLeft: "1.2rem" }}>
            {[
              ["Dati di registrazione", "Email e password (cifrata) per l'accesso all'account. Base giuridica: esecuzione del contratto."],
              ["Dati dell'attività", "Nome, tipo, servizi, orari, Partita IVA/Codice Fiscale — necessari per configurare il bot AI. Base giuridica: esecuzione del contratto."],
              ["Dati di conversazione", "Messaggi scambiati tra i clienti dell'attività e il bot Telegram. Trattati per erogare il servizio e migliorare le risposte AI. Base giuridica: legittimo interesse / esecuzione del contratto."],
              ["Dati di pagamento", "Gestiti direttamente da Stripe Inc. RistoAgent non ha mai accesso ai dati della carta. Base giuridica: esecuzione del contratto."],
              ["Dati tecnici", "Log di accesso, indirizzi IP, informazioni sul browser. Base giuridica: legittimo interesse (sicurezza e debug)."],
            ].map(([title, desc]) => (
              <li key={title as string} style={li}>
                <strong style={{ color: "#e8f0e9" }}>{title}:</strong> {desc}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Conservazione dei dati">
          <p style={p}>
            I dati dell&apos;account vengono conservati per tutta la durata del contratto e per 12 mesi
            successivi alla cancellazione (obblighi fiscali). I dati di conversazione vengono conservati
            per 90 giorni dalla data del messaggio, dopodiché vengono eliminati automaticamente.
          </p>
        </Section>

        <Section title="Destinatari dei dati">
          <p style={p}>I dati possono essere comunicati ai seguenti fornitori di servizi (responsabili del trattamento):</p>
          <ul style={{ paddingLeft: "1.2rem" }}>
            {[
              "Supabase Inc. — database e autenticazione (hosting in EU)",
              "Vercel Inc. — hosting dell'applicazione",
              "Anthropic PBC — elaborazione AI dei messaggi (Claude API)",
              "Telegram Messenger Inc. — canale di comunicazione con i clienti finali",
              "Stripe Inc. — elaborazione pagamenti",
              "Google LLC — Google Calendar (solo se collegato dall'utente)",
            ].map((item) => (
              <li key={item} style={li}>{item}</li>
            ))}
          </ul>
          <p style={p}>I dati non vengono venduti né ceduti a terzi per finalità di marketing.</p>
        </Section>

        <Section title="Trasferimento dati extra-UE">
          <p style={p}>
            Alcuni fornitori (Anthropic, Vercel, Stripe) hanno sede negli Stati Uniti. I trasferimenti
            avvengono sulla base delle Clausole Contrattuali Standard approvate dalla Commissione Europea
            (art. 46 GDPR).
          </p>
        </Section>

        <Section title="Diritti dell'interessato">
          <p style={p}>Ai sensi degli artt. 15–22 GDPR, hai il diritto di:</p>
          <ul style={{ paddingLeft: "1.2rem" }}>
            {[
              "Accedere ai tuoi dati personali",
              "Richiedere la rettifica di dati inesatti",
              "Richiedere la cancellazione dei dati (diritto all'oblio)",
              "Richiedere la limitazione del trattamento",
              "Ricevere i dati in formato portabile",
              "Opporti al trattamento basato su legittimo interesse",
              "Revocare il consenso in qualsiasi momento (dove applicabile)",
            ].map((item) => <li key={item} style={li}>{item}</li>)}
          </ul>
          <p style={p}>
            Per esercitare i tuoi diritti scrivi a{" "}
            <a href="mailto:privacy@ristoagent.com" style={{ color: "#0EA5E9" }}>privacy@ristoagent.com</a>.
            Risponderemo entro 30 giorni. Hai inoltre il diritto di proporre reclamo all&apos;Autorità
            di controllo competente (in Italia: Garante per la protezione dei dati personali —{" "}
            <span style={{ color: "#0EA5E9" }}>www.garanteprivacy.it</span>).
          </p>
        </Section>

        <Section title="Cookie" id="cookie">
          <p style={p}>
            RistoAgent utilizza esclusivamente cookie tecnici necessari al funzionamento del servizio
            (sessione di autenticazione). Non vengono utilizzati cookie di profilazione o di terze parti
            a fini pubblicitari.
          </p>
        </Section>
      </div>
    </div>
  );
}
