import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { setWebhook, getBotInfo } from "@/lib/telegram";

export async function GET(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("businesses")
    .insert({ ...body, user_id: userId })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const supabase = createServerClient();

  if (body.telegram_bot_token) {
    const botInfo = await getBotInfo(body.telegram_bot_token);
    if (!botInfo.ok) {
      return NextResponse.json(
        { error: "Token Telegram non valido. Ricontrolla il token copiato da BotFather." },
        { status: 400 }
      );
    }

    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/telegram/webhook`;
    const webhookResult = await setWebhook(
      body.telegram_bot_token,
      webhookUrl,
      process.env.TELEGRAM_WEBHOOK_SECRET!
    );

    if (!webhookResult.ok) {
      return NextResponse.json(
        { error: "Impossibile registrare il webhook Telegram." },
        { status: 500 }
      );
    }

    body.telegram_bot_username = botInfo.result?.username;
  }

  const { data, error } = await supabase
    .from("businesses")
    .update(body)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
