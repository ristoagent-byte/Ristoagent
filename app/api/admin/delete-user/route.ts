import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { isAdminEmail } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest) {
  const supabase = createServerClient();

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: userData } = await supabase.auth.getUser(token);
  const email = userData?.user?.email ?? null;
  if (!email || !isAdminEmail(email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { user_id } = await req.json();
  if (!user_id) return NextResponse.json({ error: "Missing user_id" }, { status: 400 });

  const { data: biz } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user_id)
    .single();

  if (biz) {
    await supabase.from("feedbacks").delete().eq("business_id", biz.id);
    const { data: convs } = await supabase.from("conversations").select("id").eq("business_id", biz.id);
    const convIds = convs?.map((c) => c.id) ?? [];
    if (convIds.length > 0) {
      await supabase.from("messages").delete().in("conversation_id", convIds);
    }
    await supabase.from("bookings").delete().eq("business_id", biz.id);
    await supabase.from("conversations").delete().eq("business_id", biz.id);
    await supabase.from("businesses").delete().eq("id", biz.id);
  }

  const { error } = await supabase.auth.admin.deleteUser(user_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
