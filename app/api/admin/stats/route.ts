import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "ristoagent@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function GET(req: NextRequest) {
  const supabase = createServerClient();

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const email = userData.user.email.toLowerCase();
  if (!ADMIN_EMAILS.includes(email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const since30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const [
      { data: businesses },
      { count: totalBusinesses },
      { count: newUsers24h },
      { count: newUsers7d },
      { count: newUsers30d },
      { count: messages24h },
      { count: messages7d },
      { count: bookings24h },
      { count: bookings7d },
      { count: feedbacks7d },
    ] = await Promise.all([
      supabase
        .from("businesses")
        .select(
          "id, user_id, name, type, plan, stripe_customer_id, stripe_subscription_id, trial_started_at, trial_used, created_at"
        )
        .order("created_at", { ascending: false }),
      supabase.from("businesses").select("*", { count: "exact", head: true }),
      supabase
        .from("businesses")
        .select("*", { count: "exact", head: true })
        .gte("created_at", since24h),
      supabase
        .from("businesses")
        .select("*", { count: "exact", head: true })
        .gte("created_at", since7d),
      supabase
        .from("businesses")
        .select("*", { count: "exact", head: true })
        .gte("created_at", since30d),
      supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .gte("created_at", since24h),
      supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .gte("created_at", since7d),
      supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .gte("created_at", since24h),
      supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .gte("created_at", since7d),
      supabase
        .from("feedbacks")
        .select("*", { count: "exact", head: true })
        .gte("created_at", since7d),
    ]);

    // Enrich with auth email
    const bizList = businesses ?? [];
    const emailByUser = new Map<string, string | null>();
    await Promise.all(
      bizList.map(async (b) => {
        if (!b.user_id) return;
        const { data } = await supabase.auth.admin.getUserById(b.user_id);
        emailByUser.set(b.user_id, data?.user?.email ?? null);
      })
    );

    // Plan breakdown
    const planCounts: Record<string, number> = {};
    for (const b of bizList) {
      planCounts[b.plan ?? "unknown"] = (planCounts[b.plan ?? "unknown"] ?? 0) + 1;
    }

    // Trial expiry helpers
    const trialExpiry = (startedAt: string | null) => {
      if (!startedAt) return null;
      const d = new Date(new Date(startedAt).getTime() + 15 * 24 * 60 * 60 * 1000);
      return d.toISOString();
    };

    const customers = bizList.map((b) => ({
      id: b.id,
      name: b.name,
      type: b.type,
      email: emailByUser.get(b.user_id) ?? null,
      plan: b.plan,
      paying: !!b.stripe_subscription_id,
      stripe_customer_id: b.stripe_customer_id ?? null,
      stripe_subscription_id: b.stripe_subscription_id ?? null,
      created_at: b.created_at,
      trial_started_at: b.trial_started_at,
      trial_expires_at: b.plan === "trial" ? trialExpiry(b.trial_started_at) : null,
    }));

    // --- Stripe: revenue + invoices ---
    let stripeData: {
      mrrEur: number;
      activeSubs: number;
      revenue30dEur: number;
      revenueAllTimeEur: number;
      invoices: Array<{
        id: string;
        number: string | null;
        customer: string | null;
        amount_paid: number;
        currency: string;
        status: string | null;
        created: string;
        hosted_invoice_url: string | null;
        pdf: string | null;
      }>;
      error?: string;
    } = {
      mrrEur: 0,
      activeSubs: 0,
      revenue30dEur: 0,
      revenueAllTimeEur: 0,
      invoices: [],
    };

    try {
      // Active subscriptions → MRR
      let mrrCents = 0;
      let activeSubs = 0;
      for await (const sub of stripe.subscriptions.list({ status: "active", limit: 100, expand: ["data.items.data.price"] })) {
        activeSubs += 1;
        for (const item of sub.items.data) {
          const price = item.price;
          const qty = item.quantity ?? 1;
          if (!price?.unit_amount) continue;
          const interval = price.recurring?.interval;
          const intervalCount = price.recurring?.interval_count ?? 1;
          let monthly = 0;
          if (interval === "month") monthly = (price.unit_amount * qty) / intervalCount;
          else if (interval === "year") monthly = (price.unit_amount * qty) / (12 * intervalCount);
          else if (interval === "week") monthly = (price.unit_amount * qty * 4.33) / intervalCount;
          else if (interval === "day") monthly = (price.unit_amount * qty * 30) / intervalCount;
          mrrCents += monthly;
        }
      }
      stripeData.mrrEur = Math.round(mrrCents) / 100;
      stripeData.activeSubs = activeSubs;

      // Invoices (last 100) + compute revenue buckets
      const invoices: typeof stripeData.invoices = [];
      let paidAllCents = 0;
      let paid30dCents = 0;
      const cutoff30 = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
      let count = 0;
      for await (const inv of stripe.invoices.list({ limit: 100 })) {
        if (count < 100) {
          invoices.push({
            id: inv.id ?? "",
            number: inv.number ?? null,
            customer: (inv.customer_name ?? inv.customer_email ?? (inv.customer as string | null)) ?? null,
            amount_paid: inv.amount_paid ?? 0,
            currency: inv.currency ?? "eur",
            status: inv.status ?? null,
            created: new Date((inv.created ?? 0) * 1000).toISOString(),
            hosted_invoice_url: inv.hosted_invoice_url ?? null,
            pdf: inv.invoice_pdf ?? null,
          });
          count += 1;
        }
        if (inv.status === "paid") {
          paidAllCents += inv.amount_paid ?? 0;
          if ((inv.created ?? 0) >= cutoff30) paid30dCents += inv.amount_paid ?? 0;
        }
        if (count >= 100) break;
      }
      stripeData.invoices = invoices;
      stripeData.revenue30dEur = Math.round(paid30dCents) / 100;
      stripeData.revenueAllTimeEur = Math.round(paidAllCents) / 100;
    } catch (err) {
      stripeData.error = err instanceof Error ? err.message : String(err);
    }

    return NextResponse.json({
      generatedAt: now.toISOString(),
      totals: {
        businesses: totalBusinesses ?? 0,
        planCounts,
      },
      growth: {
        newUsers24h: newUsers24h ?? 0,
        newUsers7d: newUsers7d ?? 0,
        newUsers30d: newUsers30d ?? 0,
      },
      activity: {
        messages24h: messages24h ?? 0,
        messages7d: messages7d ?? 0,
        bookings24h: bookings24h ?? 0,
        bookings7d: bookings7d ?? 0,
        feedbacks7d: feedbacks7d ?? 0,
      },
      stripe: stripeData,
      customers,
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    return NextResponse.json(
      { error: "Failed to fetch stats", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
