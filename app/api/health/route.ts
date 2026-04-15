import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from("businesses")
      .select("id", { count: "exact", head: true });

    if (error) throw error;

    return NextResponse.json({ status: "ok", db: "ok", timestamp });
  } catch {
    return NextResponse.json(
      { status: "error", db: "unreachable", timestamp },
      { status: 503 }
    );
  }
}
