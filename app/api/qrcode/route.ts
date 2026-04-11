import { NextRequest, NextResponse } from "next/server";
import { generateQRCodeBuffer } from "@/lib/qrcode";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const botUsername = searchParams.get("username");

  if (!botUsername) {
    return NextResponse.json({ error: "Missing username" }, { status: 400 });
  }

  const botUrl = `https://t.me/${botUsername}`;
  const buffer = await generateQRCodeBuffer(botUrl);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="ristoagent-qr-${botUsername}.png"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
