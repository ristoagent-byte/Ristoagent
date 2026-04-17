export type CampaignStep = {
  id: string;
  date: string;
  label: string;
  command: string;
  contacts: number;
  done: boolean;
};

export const CAMPAIGN_SCHEDULE: CampaignStep[] = [
  {
    id: "step1-A",
    date: "2026-04-16",
    label: "Step 1 — Primo contatto Tier A (rating ≥4.5)",
    command: "python invia_email.py --send --step 1 --tier A",
    contacts: 64,
    done: true,
  },
  {
    id: "step1-B",
    date: "2026-04-21",
    label: "Step 1 — Primo contatto Tier B (rating 4.0-4.4)",
    command: "python invia_email.py --send --step 1 --tier B",
    contacts: 71,
    done: false,
  },
  {
    id: "step2-A",
    date: "2026-04-23",
    label: "Step 2 — Follow-up Tier A (chi non ha aperto)",
    command: "python invia_email.py --send --step 2 --tier A",
    contacts: 64,
    done: false,
  },
  {
    id: "step2-B",
    date: "2026-04-28",
    label: "Step 2 — Follow-up Tier B (chi non ha aperto)",
    command: "python invia_email.py --send --step 2 --tier B",
    contacts: 71,
    done: false,
  },
  {
    id: "step3",
    date: "2026-04-30",
    label: "Step 3 — Last call (tutti i non convertiti)",
    command: "python invia_email.py --send --step 3",
    contacts: 135,
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
