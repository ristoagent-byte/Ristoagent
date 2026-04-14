import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termini di Servizio — RistoAgent",
  description: "Condizioni generali di servizio di RistoAgent.",
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section style={{ marginBottom: "2.5rem" }}>
    <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#0EA5E9",
      textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "1rem" }}>
      {title}
    </h2>
    {children}
  </section>
);

const p: React.CSSProperties = { color: "#7a9b7e", fontSize: "0.88rem", lineHeight: 1.9, marginBottom: "0.8rem" };
const li: React.CSSProperties = { ...p, marginBottom: "0.4rem" };

export default function TermsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0f0d", color: "#e8f0e9",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif", padding: "6rem 1.5rem 4rem" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <a href="/" style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem",
          fontWeight: 700, color: "#BAE6FD", textDecoration: "none", display: "block", marginBottom: "3rem" }}>
          Risto<span style={{ color: "#0EA5E9" }}>Agent</span>
        </a>

        <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem", letterSpacing: "-0.02em" }}>
          Termini di Servizio
        </h1>
        <p style={{ color: "#7a9b7e", marginBottom: "3rem", fontSize: "0.9rem" }}>
          Ultimo aggiornamento: aprile 2026
        </p>

        <Section title="1. Il servizio">
          <p style={p}>
            RistoAgent è un servizio SaaS che fornisce bot Telegram basati su intelligenza artificiale
            per la gestione automatizzata di prenotazioni e comunicazioni con i clienti di attività locali.
            Il servizio è erogato da Alessandro Bernabé (OSVČ, IČO 06043194, Praha, Repubblica Ceca).
          </p>
        </Section>

        <Section title="2. Prova gratuita">
          <ul style={{ paddingLeft: "1.2rem" }}>
            {[
              "La prova gratuita dura 15 giorni dalla data di attivazione dell'account.",
              "Non è richiesta nessuna carta di credito per attivare la prova.",
              "È consentita una sola prova gratuita per attività, verificata tramite Partita IVA o Codice Fiscale.",
              "Al termine dei 15 giorni, il servizio viene sospeso automaticamente fino alla sottoscrizione di un piano a pagamento.",
              "RistoAgent si riserva il diritto di revocare la prova gratuita in caso di utilizzo fraudolento.",
            ].map((item) => <li key={item} style={li}>{item}</li>)}
          </ul>
        </Section>

        <Section title="3. Piani e pagamenti">
          <p style={p}>I piani disponibili sono:</p>
          <ul style={{ paddingLeft: "1.2rem" }}>
            {[
              "Flessibile (€39/mese): 500 operazioni/mese, nessun rinnovo automatico. Il servizio rimane attivo solo per il mese pagato.",
              "Starter (€29/mese): fino a 300 operazioni/mese, rinnovo mensile automatico.",
              "Pro (€49/mese): operazioni illimitate, rinnovo mensile automatico.",
            ].map((item) => <li key={item} style={li}>{item}</li>)}
          </ul>
          <p style={p}>
            I pagamenti sono elaborati da Stripe Inc. I prezzi sono IVA inclusa ove applicabile.
            Per i piani ricorrenti, l&apos;importo viene addebitato automaticamente ogni mese.
            L&apos;utente può disdire in qualsiasi momento dalla dashboard; il servizio rimane attivo
            fino alla fine del periodo già pagato.
          </p>
        </Section>

        <Section title="4. Rimborsi">
          <p style={p}>
            Non sono previsti rimborsi per periodi parziali. In caso di problemi tecnici imputabili
            a RistoAgent che abbiano reso il servizio inutilizzabile per più di 48 ore consecutive,
            verrà riconosciuto un credito proporzionale sul mese successivo. Richieste di rimborso
            vanno inviate entro 7 giorni a{" "}
            <a href="mailto:info@ristoagent.com" style={{ color: "#0EA5E9" }}>info@ristoagent.com</a>.
          </p>
        </Section>

        <Section title="5. Obblighi dell'utente">
          <ul style={{ paddingLeft: "1.2rem" }}>
            {[
              "L'utente è responsabile della correttezza delle informazioni fornite durante l'onboarding.",
              "L'utente si impegna a non utilizzare il servizio per attività illegali, spam o raccolta non autorizzata di dati.",
              "L'utente è responsabile della configurazione del proprio bot Telegram e del rispetto dei Termini di Servizio di Telegram.",
              "L'utente deve informare i propri clienti che le conversazioni sono gestite da un sistema AI.",
            ].map((item) => <li key={item} style={li}>{item}</li>)}
          </ul>
        </Section>

        <Section title="6. Limitazione di responsabilità">
          <p style={p}>
            RistoAgent non garantisce che il servizio sia privo di errori o interruzioni. Il servizio
            è fornito &quot;così com&apos;è&quot;. In nessun caso RistoAgent sarà responsabile per
            danni indiretti, perdita di dati, mancato guadagno o danni derivanti dall&apos;uso o
            dall&apos;impossibilità di usare il servizio, nella misura massima consentita dalla legge applicabile.
          </p>
        </Section>

        <Section title="7. Modifiche al servizio e ai termini">
          <p style={p}>
            RistoAgent si riserva il diritto di modificare i presenti Termini con un preavviso di 30 giorni
            via email. L&apos;uso continuato del servizio dopo tale periodo costituisce accettazione
            delle nuove condizioni.
          </p>
        </Section>

        <Section title="8. Legge applicabile e foro competente">
          <p style={p}>
            I presenti Termini sono regolati dalla legge della Repubblica Ceca. Per qualsiasi controversia
            è competente il Tribunale di Praga, fatta salva la normativa a tutela dei consumatori
            applicabile nel paese di residenza dell&apos;utente (in particolare il Codice del Consumo
            italiano per gli utenti residenti in Italia).
          </p>
        </Section>

        <Section title="9. Contatti">
          <p style={p}>
            Per qualsiasi domanda:{" "}
            <a href="mailto:info@ristoagent.com" style={{ color: "#0EA5E9" }}>info@ristoagent.com</a>
          </p>
        </Section>
      </div>
    </div>
  );
}
