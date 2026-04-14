import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const piva = req.nextUrl.searchParams.get("piva")?.trim().toUpperCase();
  const userId = req.nextUrl.searchParams.get("userId");

  if (!piva || piva.length < 5) {
    return NextResponse.json({ error: "P.IVA non valida" }, { status: 400 });
  }

  const supabase = createServerClient();

  // Check if this P.IVA is already registered with trial_used = true
  // on a DIFFERENT user account (same user re-entering is OK)
  const { data, error } = await supabase
    .from("businesses")
    .select("id, user_id, trial_used")
    .eq("partita_iva", piva)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: "Errore database" }, { status: 500 });
  }

  if (!data) {
    // P.IVA not found — free to use
    return NextResponse.json({ blocked: false });
  }

  if (data.user_id === userId) {
    // Same user returning — allow
    return NextResponse.json({ blocked: false });
  }

  if (data.trial_used) {
    // Different user, trial already used
    return NextResponse.json({ blocked: true });
  }

  return NextResponse.json({ blocked: false });
}
