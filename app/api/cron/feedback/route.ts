import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { sendMessage, sendMonitorAlert } from "@/lib/telegram";

// Vercel Cron: runs every 30 minutes
// Finds confirmed bookings that happened 2+ hours ago with no feedback sent yet,
// sends a Telegram feedback request and marks the booking accordingly.

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

  // Find bookings confirmed, not yet sent feedback, whose date+time is 2h+ in the past
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("id, business_id, conversation_id, customer_name, date, time, businesses(telegram_bot_token, name)")
    .eq("status", "confirmed")
    .is("feedback_sent_at", null)
    .lte("date", twoHoursAgo.toLocaleDateString("en-CA", { timeZone: "Europe/Rome" }));

  if (error) {
    console.error("Cron feedback error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;

  for (const booking of bookings ?? []) {
    const biz = (booking.businesses as unknown) as { telegram_bot_token: string | null; name: string } | null;
    if (!biz?.telegram_bot_token) continue;

    // Filter: booking datetime + 2h must be in the past
    const bookingDatetime = new Date(`${booking.date}T${booking.time}:00`);
    if (bookingDatetime.getTime() + 2 * 60 * 60 * 1000 > Date.now()) continue;

    // Get conversation telegram_chat_id
    const { data: conv } = await supabase
      .from("conversations")
      .select("telegram_chat_id")
      .eq("id", booking.conversation_id)
      .single();

    if (!conv?.telegram_chat_id) continue;

    const chatId = parseInt(conv.telegram_chat_id, 10);
    const message =
      `Ciao ${booking.customer_name}! 👋\n\n` +
      `Come è andata la serata da ${biz.name}?\n\n` +
      `Lasciaci un feedback veloce — rispondi con un voto da 1 a 5 ⭐ (scrivi solo il numero) oppure raccontaci come è andata!`;

    try {
      await sendMessage(biz.telegram_bot_token, chatId, message);

      await supabase
        .from("bookings")
        .update({ feedback_sent_at: new Date().toISOString() })
        .eq("id", booking.id);

      await supabase
        .from("conversations")
        .update({ awaiting_feedback: true })
        .eq("id", booking.conversation_id);

      sent++;
    } catch (err) {
      console.error(`Feedback send failed for booking ${booking.id}:`, err);
    }
  }

  // Anomaly check: if there are active paid businesses but no messages in the last 6h
  const { count: activeCount } = await supabase
    .from("businesses")
    .select("*", { count: "exact", head: true })
    .in("plan", ["starter", "pro", "flexible", "founding_starter", "founding_pro"]);

  if ((activeCount ?? 0) > 0) {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    const { count: recentMessages } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sixHoursAgo);

    if ((recentMessages ?? 0) === 0) {
      const { data: lastMsg } = await supabase
        .from("messages")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1);

      const lastMsgTime = lastMsg?.[0]?.created_at
        ? new Date(lastMsg[0].created_at).toLocaleTimeString("it-IT", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Europe/Rome",
          })
        : "sconosciuta";

      await sendMonitorAlert(
        `⚠️ <b>ANOMALIA RISTOAGENT</b>\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `Nessun messaggio Telegram da 6h\n` +
        `Business attivi (paid): ${activeCount}\n` +
        `Ultimo messaggio: ${lastMsgTime}\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `Verifica webhook Telegram`
      );
    }
  }

  return NextResponse.json({ ok: true, sent });
}
