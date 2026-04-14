import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createServerClient } from "@/lib/supabase-server";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: NextRequest) {
  let body: { email?: unknown; message?: unknown; botReply?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON non valido" }, { status: 400 });
  }

  const { email, message, botReply } = body;

  if (!email || typeof email !== "string" || !message || typeof message !== "string") {
    return NextResponse.json({ error: "Email e messaggio obbligatori" }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email non valida" }, { status: 400 });
  }

  // Escape HTML to prevent XSS in email body
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const supabase = createServerClient();

  const { error: dbError } = await supabase.from("support_requests").insert({
    email,
    message,
    bot_reply: typeof botReply === "string" ? botReply : null,
  });

  if (dbError) {
    console.error("[support/forward] Supabase insert error:", dbError.message);
    // Continue — still attempt email delivery
  }

  try {
    await resend.emails.send({
      from: "RistoAgent Support <onboarding@resend.dev>",
      to: "info@ristoagent.com",
      subject: `Nuova richiesta di supporto da ${esc(email)}`,
      html: `
        <h2>Nuova richiesta di supporto</h2>
        <p><strong>Da:</strong> ${esc(email)}</p>
        <p><strong>Messaggio:</strong></p>
        <blockquote style="border-left:3px solid #0EA5E9;padding-left:12px;color:#555">${esc(message)}</blockquote>
        ${typeof botReply === "string" ? `<p><strong>Risposta del bot (non sufficiente):</strong></p><blockquote style="border-left:3px solid #ccc;padding-left:12px;color:#888">${esc(botReply)}</blockquote>` : ""}
        <hr/>
        <p style="color:#888;font-size:12px">Rispondi a: ${esc(email)}</p>
      `,
      replyTo: email,
    });
  } catch {
    // Email failure is non-blocking — request already saved to Supabase
  }

  return NextResponse.json({ ok: true });
}
