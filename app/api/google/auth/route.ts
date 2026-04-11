import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  const userId = new URL(request.url).searchParams.get("userId") ?? "";
  const url = getAuthUrl(userId);
  return NextResponse.redirect(url);
}
