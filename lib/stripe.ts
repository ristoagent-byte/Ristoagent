import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!.trim(), {
  apiVersion: "2026-03-25.dahlia",
});

export const PRICE_IDS: Record<string, string> = {
  flexible: process.env.STRIPE_PRICE_FLEXIBLE!.trim(),
  starter: process.env.STRIPE_PRICE_STARTER!.trim(),
  pro: process.env.STRIPE_PRICE_PRO!.trim(),
  founding_starter: process.env.STRIPE_PRICE_FOUNDING_STARTER!.trim(),
  founding_pro: process.env.STRIPE_PRICE_FOUNDING_PRO!.trim(),
};
