import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServerClient();
  const { data: biz } = await supabase
    .from("businesses")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .single();

  if (!biz?.stripe_customer_id) {
    return NextResponse.json({ error: "Nessun abbonamento attivo" }, { status: 400 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: biz.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  });

  return NextResponse.json({ url: session.url });
}
