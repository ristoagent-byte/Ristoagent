import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { isAdminEmail } from "@/lib/admin";
import { getEmailMarketingSnapshot } from "@/lib/email-marketing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  const email = userData?.user?.email ?? null;
  if (userErr || !email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminEmail(email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const snapshot = getEmailMarketingSnapshot();
    return NextResponse.json({ generatedAt: new Date().toISOString(), ...snapshot });
  } catch (err) {
    return NextResponse.json(
      { error: "Snapshot failed", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
