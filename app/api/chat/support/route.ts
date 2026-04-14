import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { loadKnowledgeText, loadScreenshots } from "@/lib/knowledge";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const SENTINEL = "Non ho informazioni su questo";
const MAX_MESSAGE_CHARS = 2000;
const MAX_HISTORY_CONTENT_CHARS = 2000;

// Simple in-process rate limiter: max 10 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; reset: number }>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) ?? { count: 0, reset: now + WINDOW_MS };
  if (now > entry.reset) { entry.count = 0; entry.reset = now + WINDOW_MS; }
  entry.count++;
  rateLimitMap.set(ip, entry);
  return entry.count > MAX_PER_WINDOW;
}

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return new Response(JSON.stringify({ error: "Troppe richieste, riprova tra un minuto" }), {
      status: 429,
    });
  }

  // Parse body safely
  let body: { message?: unknown; history?: unknown };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "JSON non valido" }), { status: 400 });
  }

  const { message, history: rawHistory } = body;

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return new Response(JSON.stringify({ error: "Messaggio vuoto" }), { status: 400 });
  }
  if (message.length > MAX_MESSAGE_CHARS) {
    return new Response(JSON.stringify({ error: "Messaggio troppo lungo" }), { status: 400 });
  }

  // Validate and sanitize history
  const history: Array<{ role: "user" | "assistant"; content: string }> = Array.isArray(rawHistory)
    ? (rawHistory as Array<unknown>)
        .filter(
          (h): h is { role: "user" | "assistant"; content: string } =>
            typeof h === "object" &&
            h !== null &&
            (((h as Record<string, unknown>).role === "user") ||
              ((h as Record<string, unknown>).role === "assistant")) &&
            typeof (h as Record<string, unknown>).content === "string"
        )
        .map((h) => ({
          role: h.role,
          content: h.content.slice(0, MAX_HISTORY_CONTENT_CHARS),
        }))
    : [];

  const knowledgeText = loadKnowledgeText();
  const screenshots = loadScreenshots();

  const systemPrompt = `Sei l'assistente di supporto di RistoAgent, un servizio che crea bot Telegram automatici per attività locali italiane.

Il tuo compito è rispondere a domande su: cos'è RistoAgent, come funziona, i piani e prezzi, come configurarlo.

Tono: professionale ma caldo. Rispondi in italiano, a meno che il visitatore non scriva in inglese — in quel caso rispondi in inglese.

Se non hai informazioni sufficienti per rispondere, di' esattamente questa frase (in italiano o inglese a seconda della lingua dell'utente):
- Italiano: "${SENTINEL}. Posso inoltrare il tuo messaggio al nostro team — risponderemo entro 24 ore."
- Inglese: "I don't have information on this. I can forward your message to our team — we'll respond within 24 hours."

Non inventare mai informazioni. Non rispondere a domande non legate a RistoAgent.

Qui sotto trovi tutta la documentazione di RistoAgent e alcuni screenshot del prodotto:

${knowledgeText}`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Only send screenshots on the first turn — saves tokens on follow-up messages
        const isFirstTurn = history.length === 0;
        const userContent: Anthropic.ContentBlockParam[] = [
          ...(isFirstTurn ? screenshots : []),
          { type: "text", text: message },
        ];

        const messages: Anthropic.MessageParam[] = [
          ...history.slice(-6).map((h) => ({
            role: h.role,
            content: h.content,
          })),
          { role: "user", content: userContent },
        ];

        const claudeStream = anthropic.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 600,
          system: systemPrompt,
          messages,
        });

        for await (const event of claudeStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            const chunk = JSON.stringify({ delta: event.delta.text });
            controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
          }
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Errore";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
