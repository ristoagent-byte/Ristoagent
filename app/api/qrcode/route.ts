import { NextRequest, NextResponse } from "next/server";
import { generateQRCodeBuffer } from "@/lib/qrcode";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const botUsername = searchParams.get("username");
  const userId = request.headers.get("x-user-id");

  if (!botUsername) {
    return NextResponse.json({ error: "Missing username" }, { status: 400 });
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();
  const { data: biz } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", userId)
    .eq("telegram_bot_username", botUsername)
    .single();

  if (!biz) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const botUrl = `https://t.me/${botUsername}`;
  const buffer = await generateQRCodeBuffer(botUrl);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="ristoagent-qr-${botUsername}.png"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
