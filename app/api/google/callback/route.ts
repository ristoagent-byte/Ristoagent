import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/google-calendar";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const userId = searchParams.get("state");

  if (error || !code || !userId) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?step=3&error=google_denied`
    );
  }

  try {
    const { access_token, refresh_token, calendar_id } =
      await exchangeCodeForTokens(code);

    const supabase = createServerClient();
    await supabase
      .from("businesses")
      .update({
        google_access_token: access_token,
        google_refresh_token: refresh_token,
        google_calendar_id: calendar_id,
      })
      .eq("user_id", userId);

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?step=4&google=connected`
    );
  } catch {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?step=3&error=google_failed`
    );
  }
}
