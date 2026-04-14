import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSecret, sendMessage } from "@/lib/telegram";
import { createServerClient } from "@/lib/supabase-server";
import { chat, detectLanguage } from "@/lib/claude";
import { checkAvailability, createCalendarEvent } from "@/lib/google-calendar";
import { Resend } from "resend";
import type { TelegramUpdate, Business, Message } from "@/types";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  if (!verifyWebhookSecret(request, process.env.TELEGRAM_WEBHOOK_SECRET!.trim())) {
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

    // Handle feedback response
    if (existingConversation.awaiting_feedback) {
      const rating = parseInt(incomingText.trim(), 10);
      const validRating = rating >= 1 && rating <= 5 ? rating : null;

      await supabase.from("feedbacks").insert({
        business_id: business.id,
        conversation_id: conversationId,
        rating: validRating,
        comment: validRating ? null : incomingText.trim(),
      });

      await supabase
        .from("conversations")
        .update({ awaiting_feedback: false })
        .eq("id", conversationId);

      const thankYou = validRating
        ? `Grazie mille per il tuo ${validRating}⭐! Il tuo feedback è prezioso per noi. A presto! 🙏`
        : `Grazie per il tuo feedback! Lo terremo in grande considerazione. A presto! 🙏`;

      if (business.telegram_bot_token) {
        await sendMessage(business.telegram_bot_token, chatId, thankYou);
      }
      await supabase.from("messages").insert({ conversation_id: conversationId, text: incomingText, sender: "customer" });
      await supabase.from("messages").insert({ conversation_id: conversationId, text: thankYou, sender: "ai" });
      return NextResponse.json({ ok: true });
    }
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

      // Send email notification to business owner
      try {
        const { data: userData } = await supabase.auth.admin.getUserById(business.user_id);
        const ownerEmail = userData?.user?.email;
        if (ownerEmail) {
          await resend.emails.send({
            from: "RistoAgent <onboarding@resend.dev>",
            to: ownerEmail,
            subject: `📅 Nuova prenotazione — ${business.name}`,
            html: `
              <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
                <h2 style="color: #0EA5E9;">Nuova prenotazione ricevuta!</h2>
                <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
                  <tr><td style="padding: 8px 0; color: #666;">Cliente</td><td style="padding: 8px 0; font-weight: 600;">${input.customer_name}</td></tr>
                  <tr><td style="padding: 8px 0; color: #666;">Data</td><td style="padding: 8px 0; font-weight: 600;">${input.date}</td></tr>
                  <tr><td style="padding: 8px 0; color: #666;">Orario</td><td style="padding: 8px 0; font-weight: 600;">${input.time}</td></tr>
                  <tr><td style="padding: 8px 0; color: #666;">Persone</td><td style="padding: 8px 0; font-weight: 600;">${input.party_size ?? 1}</td></tr>
                  ${input.notes ? `<tr><td style="padding: 8px 0; color: #666;">Note</td><td style="padding: 8px 0;">${input.notes}</td></tr>` : ""}
                </table>
                <a href="https://ristoagent.com/dashboard" style="display: inline-block; margin-top: 24px; padding: 12px 24px; background: #0EA5E9; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
                  Vedi dashboard →
                </a>
              </div>
            `,
          });
        }
      } catch (emailErr) {
        console.error("Email notification failed:", emailErr);
      }

      const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.name)}`;
      return { success: true, eventId: event.eventId, maps_link: mapsLink };
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
