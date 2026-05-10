import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import Groq from "groq-sdk";

export const runtime = "nodejs";

export async function GET() {
  const timestamp = new Date().toISOString();
  const results: Record<string, string> = { timestamp };

  // DB check
  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from("businesses")
      .select("id", { count: "exact", head: true });
    results.db = error ? `error: ${error.message}` : "ok";
  } catch (e) {
    results.db = `error: ${e instanceof Error ? e.message : String(e)}`;
  }

  // Groq check
  const key = process.env.GROQ_API_KEY_RISTOAGENT_BOT;
  if (!key) {
    results.groq = "error: GROQ_API_KEY_RISTOAGENT_BOT mancante";
  } else {
    try {
      const groq = new Groq({ apiKey: key });
      const result = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: "reply with just the word ok" }],
        max_tokens: 5,
      });
      results.groq = `ok: ${result.choices[0]?.message?.content?.slice(0, 30)}`;
    } catch (e) {
      results.groq = `error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  const allOk = Object.values(results).every((v) => !v.startsWith("error"));
  return NextResponse.json(results, { status: allOk ? 200 : 503 });
}
