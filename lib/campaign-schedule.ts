export type CampaignStep = {
  id: string;
  date: string;
  label: string;
  command: string;
  contacts: number;
  done: boolean;
};

export const CAMPAIGN_SCHEDULE: CampaignStep[] = [
  // Campagna Milano (lista originale, rating-based)
  {
    id: "step1-A",
    date: "2026-04-16",
    label: "Milano Tier A — Primo contatto (rating ≥4.5)",
    command: "python invia_email.py --send --step 1 --tier A",
    contacts: 64,
    done: true,
  },
  // Campagna OSM (6 città) — batch giornalieri 16/città per rispettare limite Resend free (100/gg)
  {
    id: "osm-batch-1",
    date: "2026-04-17",
    label: "OSM Batch 1 — 16/città (Mi, Ro, Na, To, Bo, Fi)",
    command: "python invia_osm.py --citta tutte --limit 16 --yes",
    contacts: 96,
    done: true,
  },
  {
    id: "step1-B",
    date: "2026-04-21",
    label: "Milano Tier B — Primo contatto (rating 4.0-4.4) [+ OSM 29]",
    command: "python invia_email.py --send --step 1 --tier B  (poi OSM --limit 5/città)",
    contacts: 100,
    done: false,
  },
  {
    id: "osm-batch-2",
    date: "2026-04-22",
    label: "OSM Batch 2 — 16/città",
    command: "python invia_osm.py --citta tutte --limit 16 --yes",
    contacts: 96,
    done: false,
  },
  {
    id: "step2-A",
    date: "2026-04-23",
    label: "Milano Tier A — Follow-up (Step 2) [+ OSM 32]",
    command: "python invia_email.py --send --step 2 --tier A  (poi OSM)",
    contacts: 96,
    done: false,
  },
  {
    id: "step2-B",
    date: "2026-04-28",
    label: "Milano Tier B — Follow-up (Step 2) [+ OSM 29]",
    command: "python invia_email.py --send --step 2 --tier B  (poi OSM)",
    contacts: 100,
    done: false,
  },
  {
    id: "osm-batch-3",
    date: "2026-04-29",
    label: "OSM Batch 3 — 16/città",
    command: "python invia_osm.py --citta tutte --limit 16 --yes",
    contacts: 96,
    done: false,
  },
  {
    id: "step3-parte1",
    date: "2026-04-30",
    label: "Milano Step 3 Last Call — parte 1/2 (67) [+ OSM 33]",
    command: "python invia_email.py --send --step 3 --limit 67",
    contacts: 100,
    done: false,
  },
  {
    id: "step3-parte2",
    date: "2026-05-05",
    label: "Milano Step 3 Last Call — parte 2/2 (68) [+ OSM 32]",
    command: "python invia_email.py --send --step 3 --start 67",
    contacts: 100,
    done: false,
  },
  {
    id: "osm-batch-4",
    date: "2026-05-06",
    label: "OSM Batch 4 — 16/città",
    command: "python invia_osm.py --citta tutte --limit 16 --yes",
    contacts: 96,
    done: false,
  },
  {
    id: "osm-batch-5",
    date: "2026-05-07",
    label: "OSM Batch 5 — 16/città",
    command: "python invia_osm.py --citta tutte --limit 16 --yes",
    contacts: 96,
    done: false,
  },
];

export function getCampaignStatus(today: Date = new Date()) {
  const todayStr = today.toISOString().slice(0, 10);
  const pending = CAMPAIGN_SCHEDULE.filter((s) => !s.done);
  const nextStep = pending[0] ?? null;
  const todayStep = CAMPAIGN_SCHEDULE.find((s) => !s.done && s.date === todayStr) ?? null;
  const overdue = pending.filter((s) => s.date < todayStr);
  return { nextStep, todayStep, overdue, all: CAMPAIGN_SCHEDULE };
}
