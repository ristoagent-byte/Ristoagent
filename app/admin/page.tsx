"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { isAdminEmail } from "@/lib/admin";
import { getCampaignStatus, CAMPAIGN_SCHEDULE } from "@/lib/campaign-schedule";

type Customer = {
  id: string;
  name: string;
  type: string;
  email: string | null;
  plan: string;
  paying: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  trial_started_at: string | null;
  trial_expires_at: string | null;
};

type Invoice = {
  id: string;
  number: string | null;
  customer: string | null;
  amount_paid: number;
  currency: string;
  status: string | null;
  created: string;
  hosted_invoice_url: string | null;
  pdf: string | null;
};

type Stats = {
  generatedAt: string;
  totals: { businesses: number; planCounts: Record<string, number> };
  growth: { newUsers24h: number; newUsers7d: number; newUsers30d: number };
  activity: {
    messages24h: number;
    messages7d: number;
    bookings24h: number;
    bookings7d: number;
    feedbacks7d: number;
  };
  stripe: {
    mrrEur: number;
    activeSubs: number;
    revenue30dEur: number;
    revenueAllTimeEur: number;
    invoices: Invoice[];
    error?: string;
  };
  customers: Customer[];
};

export default function AdminPanel() {
  const router = useRouter();
  const supabase = getSupabaseBrowser();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"overview" | "customers" | "invoices">("overview");
  const [customerFilter, setCustomerFilter] = useState<"all" | "paying" | "trial">("all");

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        router.push("/auth");
        return;
      }
      if (!isAdminEmail(sess.session.user.email)) {
        router.replace("/dashboard");
        return;
      }
      try {
        const res = await fetch("/api/admin/stats", {
          headers: { Authorization: `Bearer ${sess.session.access_token}` },
          cache: "no-store",
        });
        if (res.status === 401 || res.status === 403) {
          setError("Accesso negato. Non sei un amministratore.");
          setLoading(false);
          return;
        }
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          setError(j.error ?? "Errore nel caricamento dati");
          setLoading(false);
          return;
        }
        const data = (await res.json()) as Stats;
        setStats(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Errore sconosciuto");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function fmtEur(n: number) {
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
  }
  function fmtEurCents(cents: number, currency = "eur") {
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
  }
  function fmtDate(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
  }

  if (loading) {
    return (
      <main style={S.page}>
        <div style={S.loading}>Caricamento pannello admin…</div>
      </main>
    );
  }

  if (error) {
    return (
      <main style={S.page}>
        <div style={S.errorBox}>
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>⚠️ {error}</h1>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            Per accedere serve essere loggati con un&apos;email admin.
          </p>
        </div>
      </main>
    );
  }

  if (!stats) return null;

  const filteredCustomers = stats.customers.filter((c) => {
    if (customerFilter === "paying") return c.paying;
    if (customerFilter === "trial") return c.plan === "trial";
    return true;
  });

  return (
    <main style={S.page}>
      <header style={S.header}>
        <div>
          <h1 style={S.title}>Admin Panel</h1>
          <p style={S.subtitle}>
            Aggiornato: {new Date(stats.generatedAt).toLocaleString("it-IT")}
          </p>
        </div>
        <button onClick={() => location.reload()} style={S.btnSecondary}>↻ Ricarica</button>
      </header>

      <nav style={S.tabs}>
        {(["overview", "customers", "invoices"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{ ...S.tab, ...(tab === t ? S.tabActive : {}) }}
          >
            {t === "overview" ? "Panoramica" : t === "customers" ? `Clienti (${stats.customers.length})` : `Fatture (${stats.stripe.invoices.length})`}
          </button>
        ))}
      </nav>

      {tab === "overview" && (
        <>
          <CampaignReminder />

          <section style={S.grid}>
            <KPI label="MRR" value={fmtEur(stats.stripe.mrrEur)} hint={`${stats.stripe.activeSubs} abbonamenti attivi`} />
            <KPI label="Incasso 30gg" value={fmtEur(stats.stripe.revenue30dEur)} hint="Fatture pagate" />
            <KPI label="Incasso totale" value={fmtEur(stats.stripe.revenueAllTimeEur)} hint="Storico Stripe" />
            <KPI label="Clienti totali" value={String(stats.totals.businesses)} hint={`+${stats.growth.newUsers7d} ultimi 7gg`} />
          </section>

          <section style={S.grid}>
            <KPI label="Nuovi utenti 24h" value={String(stats.growth.newUsers24h)} />
            <KPI label="Nuovi utenti 7gg" value={String(stats.growth.newUsers7d)} />
            <KPI label="Nuovi utenti 30gg" value={String(stats.growth.newUsers30d)} />
            <KPI label="Messaggi 24h" value={String(stats.activity.messages24h)} hint={`${stats.activity.messages7d} ultimi 7gg`} />
            <KPI label="Prenotazioni 7gg" value={String(stats.activity.bookings7d)} hint={`${stats.activity.bookings24h} nelle ultime 24h`} />
            <KPI label="Feedback 7gg" value={String(stats.activity.feedbacks7d)} />
          </section>

          <section style={S.card}>
            <h2 style={S.cardTitle}>Distribuzione piani</h2>
            <div style={S.chipRow}>
              {Object.entries(stats.totals.planCounts).map(([plan, count]) => (
                <div key={plan} style={S.chip}>
                  <span style={{ color: "var(--muted)", marginRight: 6 }}>{plan}</span>
                  <strong>{count}</strong>
                </div>
              ))}
            </div>
          </section>

          {stats.stripe.error && (
            <section style={{ ...S.card, borderColor: "#8B2E2E", background: "#2a1414" }}>
              <strong>⚠️ Errore Stripe:</strong> {stats.stripe.error}
            </section>
          )}
        </>
      )}

      {tab === "customers" && (
        <section style={S.card}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {(["all", "paying", "trial"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setCustomerFilter(f)}
                style={{ ...S.filterBtn, ...(customerFilter === f ? S.filterBtnActive : {}) }}
              >
                {f === "all" ? "Tutti" : f === "paying" ? "Paganti" : "Trial"}
              </button>
            ))}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Ristorante</th>
                  <th style={S.th}>Email</th>
                  <th style={S.th}>Piano</th>
                  <th style={S.th}>Stato</th>
                  <th style={S.th}>Registrato</th>
                  <th style={S.th}>Trial scade</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((c) => (
                  <tr key={c.id} style={S.tr}>
                    <td style={S.td}>
                      <div style={{ fontWeight: 500 }}>{c.name}</div>
                      <div style={{ color: "var(--muted)", fontSize: 12 }}>{c.type}</div>
                    </td>
                    <td style={S.td}>{c.email ?? "—"}</td>
                    <td style={S.td}>
                      <span style={{ ...S.pill, background: c.paying ? "rgba(14,165,233,0.15)" : "rgba(122,155,126,0.15)" }}>
                        {c.plan}
                      </span>
                    </td>
                    <td style={S.td}>
                      {c.paying ? "💳 Pagante" : c.plan === "trial" ? "🆓 Trial" : c.plan}
                    </td>
                    <td style={S.td}>{fmtDate(c.created_at)}</td>
                    <td style={S.td}>{fmtDate(c.trial_expires_at)}</td>
                  </tr>
                ))}
                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ ...S.td, textAlign: "center", color: "var(--muted)" }}>
                      Nessun cliente in questa categoria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "invoices" && (
        <section style={S.card}>
          <div style={{ overflowX: "auto" }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Numero</th>
                  <th style={S.th}>Cliente</th>
                  <th style={S.th}>Importo</th>
                  <th style={S.th}>Stato</th>
                  <th style={S.th}>Data</th>
                  <th style={S.th}>Link</th>
                </tr>
              </thead>
              <tbody>
                {stats.stripe.invoices.map((inv) => (
                  <tr key={inv.id} style={S.tr}>
                    <td style={S.td}>{inv.number ?? inv.id.slice(0, 10)}</td>
                    <td style={S.td}>{inv.customer ?? "—"}</td>
                    <td style={S.td}>{fmtEurCents(inv.amount_paid, inv.currency)}</td>
                    <td style={S.td}>
                      <span style={{ ...S.pill, background: inv.status === "paid" ? "rgba(14,165,233,0.15)" : "rgba(240,180,40,0.15)" }}>
                        {inv.status ?? "—"}
                      </span>
                    </td>
                    <td style={S.td}>{fmtDate(inv.created)}</td>
                    <td style={S.td}>
                      {inv.hosted_invoice_url && (
                        <a href={inv.hosted_invoice_url} target="_blank" rel="noreferrer" style={S.link}>Apri</a>
                      )}
                      {inv.pdf && (
                        <> · <a href={inv.pdf} target="_blank" rel="noreferrer" style={S.link}>PDF</a></>
                      )}
                    </td>
                  </tr>
                ))}
                {stats.stripe.invoices.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ ...S.td, textAlign: "center", color: "var(--muted)" }}>
                      Nessuna fattura disponibile.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}

function KPI({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div style={S.kpi}>
      <div style={S.kpiLabel}>{label}</div>
      <div style={S.kpiValue}>{value}</div>
      {hint && <div style={S.kpiHint}>{hint}</div>}
    </div>
  );
}

function CampaignReminder() {
  const { nextStep, todayStep, overdue } = getCampaignStatus();
  const todayStr = new Date().toISOString().slice(0, 10);

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("it-IT", { weekday: "short", day: "2-digit", month: "short" });

  return (
    <section style={{ ...S.card, borderColor: todayStep ? "var(--green)" : "var(--border)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={S.cardTitle}>📧 Campagna Email — Promemoria invii</h2>
        {todayStep && (
          <span style={{ ...S.pill, background: "rgba(14,165,233,0.2)", color: "var(--green)", fontWeight: 600 }}>
            OGGI → invia!
          </span>
        )}
      </div>

      {todayStep && (
        <div style={{ background: "var(--surface2)", padding: 12, borderRadius: 8, marginBottom: 12, borderLeft: "3px solid var(--green)" }}>
          <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>Invio di oggi</div>
          <div style={{ fontWeight: 500, marginBottom: 6 }}>{todayStep.label}</div>
          <code style={{ background: "var(--bg)", padding: "6px 10px", borderRadius: 4, fontSize: 12, display: "inline-block" }}>
            cd marketing && {todayStep.command}
          </code>
        </div>
      )}

      {!todayStep && nextStep && (
        <div style={{ marginBottom: 12, fontSize: 14 }}>
          Prossimo invio: <strong>{fmt(nextStep.date)}</strong> — {nextStep.label} ({nextStep.contacts} contatti)
        </div>
      )}

      {overdue.length > 0 && !todayStep && (
        <div style={{ color: "#f97316", fontSize: 13, marginBottom: 12 }}>
          ⚠️ {overdue.length} invio/i in ritardo — apri il calendario sotto
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Data</th>
              <th style={S.th}>Invio</th>
              <th style={S.th}>Contatti</th>
              <th style={S.th}>Stato</th>
            </tr>
          </thead>
          <tbody>
            {CAMPAIGN_SCHEDULE.map((s) => {
              const isPast = s.date < todayStr;
              const isToday = s.date === todayStr;
              let status: { label: string; color: string };
              if (s.done) status = { label: "✅ Inviato", color: "rgba(14,165,233,0.15)" };
              else if (isToday) status = { label: "📤 Oggi", color: "rgba(14,165,233,0.25)" };
              else if (isPast) status = { label: "⚠️ In ritardo", color: "rgba(249,115,22,0.15)" };
              else status = { label: "⏳ In attesa", color: "rgba(122,155,126,0.15)" };
              return (
                <tr key={s.id} style={S.tr}>
                  <td style={S.td}>{fmt(s.date)}</td>
                  <td style={S.td}>{s.label}</td>
                  <td style={S.td}>{s.contacts}</td>
                  <td style={S.td}>
                    <span style={{ ...S.pill, background: status.color }}>{status.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "var(--bg)",
    color: "var(--text)",
    padding: "32px 20px",
    maxWidth: 1200,
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 24,
    gap: 16,
    flexWrap: "wrap",
  },
  title: { fontSize: 28, fontWeight: 700, fontFamily: "Playfair Display, serif" },
  subtitle: { fontSize: 13, color: "var(--muted)" },
  tabs: { display: "flex", gap: 4, borderBottom: "1px solid var(--border)", marginBottom: 24, flexWrap: "wrap" },
  tab: {
    background: "transparent",
    color: "var(--muted)",
    border: "none",
    padding: "10px 16px",
    fontSize: 14,
    cursor: "pointer",
    borderBottom: "2px solid transparent",
  },
  tabActive: { color: "var(--text)", borderBottomColor: "var(--green)" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 12,
    marginBottom: 16,
  },
  kpi: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    padding: 16,
  },
  kpiLabel: { fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.5 },
  kpiValue: { fontSize: 24, fontWeight: 600, marginTop: 6 },
  kpiHint: { fontSize: 12, color: "var(--muted)", marginTop: 4 },
  card: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: 600, marginBottom: 12 },
  chipRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  chip: {
    padding: "6px 12px",
    background: "var(--surface2)",
    border: "1px solid var(--border)",
    borderRadius: 999,
    fontSize: 13,
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: {
    textAlign: "left",
    padding: "10px 8px",
    borderBottom: "1px solid var(--border)",
    color: "var(--muted)",
    fontWeight: 500,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tr: { borderBottom: "1px solid var(--border)" },
  td: { padding: "12px 8px", verticalAlign: "top" },
  pill: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 500,
  },
  link: { color: "var(--green)", textDecoration: "none" },
  filterBtn: {
    background: "var(--surface2)",
    color: "var(--muted)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    padding: "6px 12px",
    fontSize: 13,
    cursor: "pointer",
  },
  filterBtnActive: { color: "var(--text)", borderColor: "var(--green)" },
  btnSecondary: {
    background: "var(--surface2)",
    color: "var(--text)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    padding: "8px 16px",
    fontSize: 13,
    cursor: "pointer",
  },
  loading: { textAlign: "center", padding: 80, color: "var(--muted)" },
  errorBox: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    padding: 32,
    maxWidth: 500,
    margin: "80px auto",
    textAlign: "center",
  },
};
