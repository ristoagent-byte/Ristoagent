import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_TEXT_LENGTH = 20000; // characters stored in DB

const IMAGE_EXTS = ["jpg", "jpeg", "png", "webp", "gif"];
const IMAGE_MIME: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
  webp: "image/webp", gif: "image/gif",
};

async function extractText(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (ext === "txt") {
    return await file.text();
  }

  if (IMAGE_EXTS.includes(ext)) {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await model.generateContent([
      "Estrai tutto il testo visibile in questa immagine nel modo più fedele possibile. Se è un menu, elenca tutti i piatti con prezzi e descrizioni. Rispondi solo con il testo estratto, senza commenti.",
      { inlineData: { data: buffer.toString("base64"), mimeType: IMAGE_MIME[ext] } },
    ]);
    return result.response.text();
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (ext === "pdf") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (ext === "docx" || ext === "doc") {
    const mammoth = await import("mammoth");
    const { value } = await mammoth.extractRawText({ buffer });
    return value;
  }

  if (ext === "xlsx" || ext === "xls") {
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(buffer, { type: "buffer" });
    return workbook.SheetNames.map((name) => {
      const sheet = workbook.Sheets[name];
      return `[${name}]\n${XLSX.utils.sheet_to_csv(sheet)}`;
    }).join("\n\n");
  }

  throw new Error(`Formato non supportato: .${ext}`);
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Form data non valido" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Nessun file ricevuto" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File troppo grande (max 5 MB)" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!["txt", "pdf", "docx", "doc", "xlsx", "xls", ...IMAGE_EXTS].includes(ext)) {
    return NextResponse.json(
      { error: "Formato non supportato. Usa PDF, Word (.docx), Excel (.xlsx), TXT o immagine (JPG, PNG)" },
      { status: 400 }
    );
  }

  let extractedText: string;
  try {
    extractedText = await extractText(file);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Errore lettura file";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const trimmed = extractedText.trim().slice(0, MAX_TEXT_LENGTH);
  if (!trimmed) {
    return NextResponse.json({ error: "Il file è vuoto o non contiene testo leggibile" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { error } = await supabase
    .from("businesses")
    .update({ custom_info: trimmed })
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, characters: trimmed.length });
}

export async function DELETE(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();
  const { error } = await supabase
    .from("businesses")
    .update({ custom_info: null })
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
