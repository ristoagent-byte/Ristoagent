import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSecret, sendMessage } from "@/lib/telegram";
import { createServerClient } from "@/lib/supabase-server";
import { chat, detectLanguage } from "@/lib/claude";
import { checkAvailability, createCalendarEvent } from "@/lib/google-calendar";
import type { TelegramUpdate, Business, Message } from "@/types";

export async function POST(request: NextRequest) {
  if (!verifyWebhookSecret(request, process.env.TELEGRAM_WEBHOOK_SECRET!)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const update: TelegramUpdate = await request.json();
  const message = update.message;

  if (!message?.text || !message.chat) {
    return NextResponse.json({ ok: true });
  }

  const chatId = message.chat.id;
  const customerName =
    [message.from?.first_name, message.from?.last_name]
      .filter(Boolean)
      .join(" ") || "Cliente";
  const incomingText = message.text;

  const supabase = createServerClient();

  const { data: existingConversation } = await supabase
    .from("conversations")
    .select("*, businesses(*)")
    .eq("telegram_chat_id", chatId.toString())
    .single();

  let business: Business;
  let conversationId: string;

  if (existingConversation) {
    business = existingConversation.businesses as Business;
    conversationId = existingConversation.id;

    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversationId);
  } else {
    const { data: bizData } = await supabase
      .from("businesses")
      .select("*")
      .not("telegram_bot_token", "is", null)
      .limit(1)
      .single();

    if (!bizData) {
      return NextResponse.json({ ok: true });
    }

    business = bizData as Business;
    const language = detectLanguage(incomingText);

    const { data: newConv } = await supabase
      .from("conversations")
      .insert({
        business_id: business.id,
        telegram_chat_id: chatId.toString(),
        customer_name: customerName,
        language,
      })
      .select()
      .single();

    conversationId = newConv!.id;
  }

  await supabase.from("messages").insert({
    conversation_id: conversationId,
    text: incomingText,
    sender: "customer",
  });

  const { data: history } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(20);

  const messageHistory: Message[] = (history ?? []).slice(0, -1);
  const language = detectLanguage(incomingText);

  async function toolHandler(
    name: string,
    input: Record<string, unknown>
  ): Promise<unknown> {
    if (!business.google_access_token || !business.google_refresh_token || !business.google_calendar_id) {
      return { error: "Google Calendar not connected" };
    }

    if (name === "check_availability") {
      return checkAvailability(
        business.google_access_token,
        business.google_refresh_token,
        business.google_calendar_id,
        input.date as string,
        input.time as string,
        (input.duration_minutes as number) ?? 60
      );
    }

    if (name === "create_booking") {
      const event = await createCalendarEvent(
        business.google_access_token,
        business.google_refresh_token,
        business.google_calendar_id,
        {
          date: input.date as string,
          time: input.time as string,
          durationMinutes: (input.duration_minutes as number) ?? 60,
          customerName: input.customer_name as string,
          partySize: input.party_size as number | undefined,
          notes: input.notes as string | undefined,
        }
      );

      await supabase.from("bookings").insert({
        business_id: business.id,
        conversation_id: conversationId,
        customer_name: input.customer_name as string,
        date: input.date as string,
        time: input.time as string,
        party_size: (input.party_size as number) ?? 1,
        google_event_id: event.eventId,
        status: "confirmed",
      });

      return { success: true, eventId: event.eventId };
    }

    return { error: "Unknown tool" };
  }

  const { reply } = await chat(
    business,
    messageHistory,
    incomingText,
    language,
    toolHandler
  );

  if (reply && business.telegram_bot_token) {
    await sendMessage(business.telegram_bot_token, chatId, reply);
  }

  if (reply) {
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      text: reply,
      sender: "ai",
    });
  }

  return NextResponse.json({ ok: true });
}
