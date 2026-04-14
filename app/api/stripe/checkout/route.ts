import { NextRequest, NextResponse } from "next/server";
import { stripe, PRICE_IDS } from "@/lib/stripe";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const { planId, userId } = await req.json();

  if (!planId || !userId) {
    return NextResponse.json({ error: "Missing planId or userId" }, { status: 400 });
  }

  const priceId = PRICE_IDS[planId];
  if (!priceId) {
    return NextResponse.json({ error: "Piano non valido" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data: biz } = await supabase
    .from("businesses")
    .select("id, name, stripe_customer_id")
    .eq("user_id", userId)
    .single();

  if (!biz) {
    return NextResponse.json({ error: "Business non trovato" }, { status: 404 });
  }

  const { data: userData } = await supabase.auth.admin.getUserById(userId);
  const email = userData?.user?.email ?? "";

  // Get or create Stripe customer
  let customerId = biz.stripe_customer_id as string | null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email,
      name: biz.name,
      metadata: { userId, businessId: biz.id },
    });
    customerId = customer.id;
    await supabase
      .from("businesses")
      .update({ stripe_customer_id: customerId })
      .eq("id", biz.id);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!.trim();

  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      subscription_data: {
        metadata: { userId, businessId: biz.id, planId },
        ...(planId === "flexible" ? { cancel_at_period_end: true } : {}),
      },
      success_url: `${appUrl}/dashboard?payment=success`,
      cancel_url: `${appUrl}/upgrade`,
      metadata: { userId, businessId: biz.id, planId },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Stripe checkout error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
