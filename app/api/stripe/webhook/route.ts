import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: any;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!.trim());
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServerClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const { businessId, planId } = session.metadata ?? {};
      if (businessId && planId) {
        await supabase.from("businesses").update({
          plan: planId,
          stripe_subscription_id: session.subscription as string,
          trial_used: true,
        }).eq("id", businessId);
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object;
      const businessId = sub.metadata?.businessId;
      const planId = sub.metadata?.planId;
      if (businessId) {
        await supabase.from("businesses").update({
          plan: planId ?? "starter",
          stripe_subscription_id: sub.id,
        }).eq("id", businessId);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const businessId = sub.metadata?.businessId;
      if (businessId) {
        await supabase.from("businesses").update({
          plan: "trial",
          stripe_subscription_id: null,
        }).eq("id", businessId);
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object;
      const customerId = invoice.customer as string;
      console.log(`Payment failed for customer ${customerId}`);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
