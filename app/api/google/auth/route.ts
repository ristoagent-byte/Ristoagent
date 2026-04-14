import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") ?? "";

  // Debug mode: ?debug=1 shows the OAuth URL instead of redirecting
  if (searchParams.get("debug") === "1") {
    const url = getAuthUrl(userId);
    return NextResponse.json({
      clientId: process.env.GOOGLE_CLIENT_ID?.slice(0, 20) + "...",
      redirectUri: process.env.GOOGLE_REDIRECT_URI,
      generatedUrl: url.slice(0, 200) + "...",
    });
  }

  const url = getAuthUrl(userId);
  return NextResponse.redirect(url);
}
