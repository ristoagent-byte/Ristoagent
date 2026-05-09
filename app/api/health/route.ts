import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

  // Gemini check
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    results.gemini = "error: GEMINI_API_KEY mancante";
  } else {
    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent("reply with just the word 'ok'");
      results.gemini = `ok: ${result.response.text().slice(0, 30)}`;
    } catch (e) {
      results.gemini = `error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  const allOk = Object.values(results).every((v) => !v.startsWith("error"));
  return NextResponse.json(results, { status: allOk ? 200 : 503 });
}
