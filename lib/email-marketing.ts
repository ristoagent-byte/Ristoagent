import milanoLog from "@/marketing/invii_log.json";
import osmLog from "@/marketing/invii_osm_log.json";
import { CAMPAIGN_SCHEDULE } from "./campaign-schedule";

export const MILANO_POOL_TOTAL = 140;

export const OSM_POOL_BY_CITY: Record<string, number> = {
  milano: 269,
  roma: 411,
  napoli: 43,
  torino: 362,
  bologna: 111,
  firenze: 118,
};

export const OSM_POOL_TOTAL = Object.values(OSM_POOL_BY_CITY).reduce((a, b) => a + b, 0);

type MilanoLog = { step1: string[]; step2: string[]; step3: string[]; errori: unknown[] };
type OsmLog = { inviati: string[]; errori: unknown[] };

const milano = milanoLog as MilanoLog;
const osm = osmLog as OsmLog;

export type CityStats = {
  citta: string;
  inviate: number;
  pool: number;
  pct: number;
  rimanenti: number;
};

export type StepStats = {
  id: string;
  label: string;
  inviate: number;
  pool: number;
  pct: number;
};

export function getEmailMarketingSnapshot() {
  const milanoStep1 = milano.step1?.length ?? 0;
  const milanoStep2 = milano.step2?.length ?? 0;
  const milanoStep3 = milano.step3?.length ?? 0;
  const osmInviate = osm.inviati?.length ?? 0;
  const erroriMilano = Array.isArray(milano.errori) ? milano.errori.length : 0;
  const erroriOsm = Array.isArray(osm.errori) ? osm.errori.length : 0;

  const totaleInviate = milanoStep1 + milanoStep2 + milanoStep3 + osmInviate;
  const totaleErrori = erroriMilano + erroriOsm;

  const milanoSteps: StepStats[] = [
    {
      id: "step1",
      label: "Milano · Step 1 — Primo contatto",
      inviate: milanoStep1,
      pool: MILANO_POOL_TOTAL,
      pct: pct(milanoStep1, MILANO_POOL_TOTAL),
    },
    {
      id: "step2",
      label: "Milano · Step 2 — Follow-up",
      inviate: milanoStep2,
      pool: MILANO_POOL_TOTAL,
      pct: pct(milanoStep2, MILANO_POOL_TOTAL),
    },
    {
      id: "step3",
      label: "Milano · Step 3 — Last call",
      inviate: milanoStep3,
      pool: MILANO_POOL_TOTAL,
      pct: pct(milanoStep3, MILANO_POOL_TOTAL),
    },
  ];

  const osmByCity: CityStats[] = Object.entries(OSM_POOL_BY_CITY).map(([citta, pool]) => {
    return { citta, inviate: 0, pool, pct: 0, rimanenti: pool };
  });

  // Per-city OSM sent count is not stored per-city in the log.
  // We infer equal distribution from batches run so far (16 × N times per city).
  // This assumes each osm-batch-N done: true means 16 per city actually went out.
  const osmBatchesDone = CAMPAIGN_SCHEDULE.filter((s) => s.id.startsWith("osm-batch") && s.done).length;
  const perCityInferred = osmBatchesDone * 16;
  for (const c of osmByCity) {
    c.inviate = Math.min(perCityInferred, c.pool);
    c.rimanenti = c.pool - c.inviate;
    c.pct = pct(c.inviate, c.pool);
  }

  const osmInviateSum = osmByCity.reduce((a, b) => a + b.inviate, 0);
  // If sum differs from actual log, scale uniformly (unlikely but for safety)
  if (osmInviate > 0 && Math.abs(osmInviate - osmInviateSum) > osmByCity.length) {
    // Adjust using ratio — only when inferred doesn't match the log
    const ratio = osmInviate / Math.max(osmInviateSum, 1);
    for (const c of osmByCity) {
      c.inviate = Math.round(c.inviate * ratio);
      c.rimanenti = c.pool - c.inviate;
      c.pct = pct(c.inviate, c.pool);
    }
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const invioOggi = CAMPAIGN_SCHEDULE.find((s) => s.date === todayStr);
  const prossimoInvio = CAMPAIGN_SCHEDULE.find((s) => !s.done && s.date > todayStr);
  const inviiRimanenti = CAMPAIGN_SCHEDULE.filter((s) => !s.done).reduce((a, b) => a + b.contacts, 0);

  const RESEND_DAILY_LIMIT = 100;
  const quotaOggiUsata = invioOggi?.done ? invioOggi.contacts : 0;

  return {
    totals: {
      inviate: totaleInviate,
      errori: totaleErrori,
      poolTotale: MILANO_POOL_TOTAL + OSM_POOL_TOTAL,
      poolRimanente: (MILANO_POOL_TOTAL + OSM_POOL_TOTAL) - totaleInviate,
      coperturaPct: pct(totaleInviate, MILANO_POOL_TOTAL + OSM_POOL_TOTAL),
    },
    today: {
      date: todayStr,
      invio: invioOggi ?? null,
      quotaUsata: quotaOggiUsata,
      quotaLimite: RESEND_DAILY_LIMIT,
    },
    next: {
      prossimo: prossimoInvio ?? null,
      inviiRimanenti,
    },
    milano: {
      poolTotale: MILANO_POOL_TOTAL,
      inviate: milanoStep1 + milanoStep2 + milanoStep3,
      steps: milanoSteps,
    },
    osm: {
      poolTotale: OSM_POOL_TOTAL,
      inviate: osmInviate,
      batchesDone: osmBatchesDone,
      byCity: osmByCity,
    },
  };
}

function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

export type EmailMarketingSnapshot = ReturnType<typeof getEmailMarketingSnapshot>;
