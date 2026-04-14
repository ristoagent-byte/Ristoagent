import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { sendMessage } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: "Messaggio vuoto" }, { status: 400 });

  const supabase = createServerClient();

  const { data: biz } = await supabase
    .from("businesses")
    .select("id, telegram_bot_token")
    .eq("user_id", userId)
    .single();

  if (!biz?.telegram_bot_token) {
    return NextResponse.json({ error: "Bot Telegram non configurato" }, { status: 400 });
  }

  const { data: conversations } = await supabase
    .from("conversations")
    .select("telegram_chat_id")
    .eq("business_id", biz.id);

  if (!conversations?.length) {
    return NextResponse.json({ sent: 0 });
  }

  let sent = 0;
  for (const conv of conversations) {
    try {
      await sendMessage(biz.telegram_bot_token, parseInt(conv.telegram_chat_id, 10), message);
      sent++;
      // Small delay to respect Telegram rate limits
      await new Promise((r) => setTimeout(r, 50));
    } catch {
      // Continue even if one send fails
    }
  }

  return NextResponse.json({ sent });
}
