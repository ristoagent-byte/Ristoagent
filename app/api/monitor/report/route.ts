import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  // Auth check
  const secret = req.headers.get("x-monitor-secret");
  if (secret !== process.env.MONITOR_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();
  const now = new Date();
  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  // --- Parallel queries ---
  const [
    { count: newUsers },
    { count: activeBusinesses },
    { count: messagesReceived },
    { count: bookingsCreated },
    { count: feedbacksCollected },
    { data: expiringTrials },
    { data: lastMsg },
    { count: missedFeedbacks },
  ] = await Promise.all([
    supabase
      .from("businesses")
      .select("*", { count: "exact", head: true })
      .gte("created_at", since24h),

    supabase
      .from("businesses")
      .select("*", { count: "exact", head: true })
      .in("plan", ["trial", "starter", "pro", "flexible", "founding_starter", "founding_pro"]),

    supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .gte("created_at", since24h),

    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .gte("created_at", since24h),

    supabase
      .from("feedbacks")
      .select("*", { count: "exact", head: true })
      .gte("created_at", since24h),

    // Trials expiring within 3 days: trial_started_at <= 12 days ago
    supabase
      .from("businesses")
      .select("name, trial_started_at")
      .eq("plan", "trial")
      .lte(
        "trial_started_at",
        new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString()
      ),

    supabase
      .from("messages")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1),

    // Yesterday's confirmed bookings with no feedback sent = cron didn't run
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("date", new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split("T")[0])
      .eq("status", "confirmed")
      .is("feedback_sent_at", null),
  ]);

  // Hours since last message
  const lastMessageAt = lastMsg?.[0]?.created_at ?? null;
  const hoursSinceLastMessage = lastMessageAt
    ? Math.floor((now.getTime() - new Date(lastMessageAt).getTime()) / (1000 * 60 * 60))
    : null;

  // Trial expiry dates
  const trialsWithExpiry = (expiringTrials ?? []).map((b) => ({
    name: b.name,
    expiresAt: new Date(
      new Date(b.trial_started_at).getTime() + 15 * 24 * 60 * 60 * 1000
    )
      .toISOString()
      .split("T")[0],
  }));

  const cronOk = (missedFeedbacks ?? 0) === 0;

  // --- Compose Telegram message ---
  const dateStr = now.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Rome",
  });

  const warningLines: string[] = [];
  if (trialsWithExpiry.length > 0) {
    warningLines.push(`  • Trial in scadenza (3gg): ${trialsWithExpiry.length}`);
    trialsWithExpiry.forEach((t) => {
      warningLines.push(`    → ${t.name} (${t.expiresAt})`);
    });
  }
  if (!cronOk) {
    warningLines.push(`  • ⚠️ Cron feedback: prenotazioni ieri senza feedback`);
  }
  if (hoursSinceLastMessage !== null && hoursSinceLastMessage >= 6 && (activeBusinesses ?? 0) > 0) {
    warningLines.push(`  • ⚠️ Nessun messaggio da ${hoursSinceLastMessage}h`);
  }

  const telegramMessage = [
    `📊 <b>Report RistoAgent — ${dateStr}</b>`,
    ``,
    `🌐 <b>Infrastruttura</b>`,
    `  • Database: ✅ ok`,
    `  • Cron feedback: ${cronOk ? "✅ ok" : "❌ non girato ieri"}`,
    ``,
    `📈 <b>Ultime 24h</b>`,
    `  • Nuovi utenti: ${newUsers ?? 0}`,
    `  • Business attivi: ${activeBusinesses ?? 0}`,
    `  • Messaggi ricevuti: ${messagesReceived ?? 0}`,
    `  • Prenotazioni create: ${bookingsCreated ?? 0}`,
    `  • Feedback raccolti: ${feedbacksCollected ?? 0}`,
    ...(warningLines.length > 0
      ? [``, `⚠️ <b>Attenzione</b>`, ...warningLines]
      : [``, `✅ <b>Nessuna anomalia</b>`]),
  ].join("\n");

  return NextResponse.json({
    telegramMessage,
    data: {
      newUsers: newUsers ?? 0,
      activeBusinesses: activeBusinesses ?? 0,
      messagesReceived: messagesReceived ?? 0,
      bookingsCreated: bookingsCreated ?? 0,
      feedbacksCollected: feedbacksCollected ?? 0,
      trialsExpiringSoon: trialsWithExpiry,
      cronFeedbackOk: cronOk,
      hoursSinceLastMessage,
    },
  });
}
