import Anthropic from "@anthropic-ai/sdk";
import type { Business, Message } from "@/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

function buildSystemPrompt(business: Business, language: "it" | "en"): string {
  const now = new Date();
  const today = now.toLocaleDateString("en-CA", { timeZone: "Europe/Rome" }); // YYYY-MM-DD in Italy
  const todayFormatted = now.toLocaleDateString("it-IT", { timeZone: "Europe/Rome", weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const langInstruction =
    language === "it"
      ? "Rispondi SEMPRE in italiano, con tono caldo e professionale. NON usare mai l'inglese a meno che il cliente non scriva in inglese."
      : "Always reply in English, with a warm and professional tone. Only use English if the customer writes in English.";

  const customInfoSection = business.custom_info
    ? `\nAdditional business information (menu, services, details):\n${business.custom_info}`
    : "";

  const capacitySection = (business.tables_2 || business.tables_4 || business.tables_6)
    ? `\n- Restaurant capacity: ${business.tables_2 ?? 0} tables for 2, ${business.tables_4 ?? 0} tables for 4, ${business.tables_6 ?? 0} tables for 6+${business.has_terrace ? ", outdoor terrace available" : ""}`
    : "";

  const rulesSection = business.reservation_duration_min
    ? `\n- Booking rules: average duration ${business.reservation_duration_min} min, delay tolerance ${business.max_delay_min ?? 15} min, minimum notice ${business.min_notice_hours ?? 1}h before booking`
    : "";

  return `You are a virtual assistant for "${business.name}", a ${business.type} in Italy.

Today's date: ${todayFormatted} (${today}). Use this to interpret relative dates like "tomorrow", "next week", etc.

${langInstruction}

Business information:
- Services, prices and practical info: ${business.services ?? "non specificato"}
- Opening hours and bookings: ${business.opening_hours ?? "non specificato"}${capacitySection}${rulesSection}${customInfoSection}

Your responsibilities:
- Answer questions about services, prices, and opening hours
- Manage bookings: collect date, time, party size, and customer name before booking
- Use the check_availability tool BEFORE confirming any booking
- Use the create_booking tool to finalize confirmed bookings
- When create_booking succeeds, always include the maps_link from the tool result at the end of the confirmation message, labeled as "📍 Come raggiungerci:" (in Italian) or "📍 How to find us:" (in English)
- Never invent information not listed above
- Keep replies concise and friendly
- If you don't know something, say so honestly`;
}

const tools: Anthropic.Tool[] = [
  {
    name: "check_availability",
    description: "Check if a date and time slot is available in the business calendar",
    input_schema: {
      type: "object" as const,
      properties: {
        date: { type: "string", description: "Date in YYYY-MM-DD format" },
        time: { type: "string", description: "Time in HH:MM format (24h)" },
        duration_minutes: { type: "number", description: "Duration in minutes (default 90)" },
      },
      required: ["date", "time"],
    },
  },
  {
    name: "create_booking",
    description: "Create a confirmed booking in the business calendar",
    input_schema: {
      type: "object" as const,
      properties: {
        date: { type: "string", description: "Date in YYYY-MM-DD format" },
        time: { type: "string", description: "Time in HH:MM format (24h)" },
        duration_minutes: { type: "number", description: "Duration in minutes (default 90)" },
        customer_name: { type: "string", description: "Customer full name" },
        party_size: { type: "number", description: "Number of people" },
        notes: { type: "string", description: "Optional notes" },
      },
      required: ["date", "time", "customer_name"],
    },
  },
];

export interface ChatResult {
  reply: string;
  toolCalls: Array<{
    name: string;
    input: Record<string, unknown>;
    result?: unknown;
  }>;
}

export async function chat(
  business: Business,
  history: Message[],
  newMessage: string,
  language: "it" | "en",
  toolHandler: (name: string, input: Record<string, unknown>) => Promise<unknown>
): Promise<ChatResult> {
  const systemPrompt = buildSystemPrompt(business, language);

  const claudeMessages: Anthropic.MessageParam[] = history.slice(-20).map((m) => ({
    role: m.sender === "customer" ? "user" : "assistant",
    content: m.text,
  }));
  claudeMessages.push({ role: "user", content: newMessage });

  const toolCalls: ChatResult["toolCalls"] = [];
  let messages = claudeMessages;

  while (true) {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      tools,
      messages,
    });

    if (response.stop_reason === "end_turn") {
      const textBlock = response.content.find((b) => b.type === "text");
      return {
        reply: textBlock?.type === "text" ? textBlock.text : "",
        toolCalls,
      };
    }

    if (response.stop_reason === "tool_use") {
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of response.content) {
        if (block.type === "tool_use") {
          const input = block.input as Record<string, unknown>;
          const result = await toolHandler(block.name, input);
          toolCalls.push({ name: block.name, input, result });
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify(result),
          });
        }
      }

      messages = [
        ...messages,
        { role: "assistant", content: response.content },
        { role: "user", content: toolResults },
      ];
      continue;
    }

    break;
  }

  return { reply: "", toolCalls };
}

export function detectLanguage(text: string): "it" | "en" {
  const englishWords = /\b(hello|hi|hey|please|thank|thanks|book|booking|available|availability|what|when|where|how|can|could|would|is|are|do|does|have|has|the|and|for|with|this|that|your|you|me|my|want|need|help|open|close|price|cost)\b/i;
  const italianWords = /\b(ciao|grazie|buon|vorrei|sono|siete|avete|per|con|una|uno|della|del|che|non|ho|ha|salve|buongiorno|buonasera|prenot|orari|servizi|disponib|quanto|quando|dove|come|posso|voglio|mi|il|la|lo|le|gli|un|una|questo|quello)\b/i;
  const itScore = (text.match(italianWords) ?? []).length;
  const enScore = (text.match(englishWords) ?? []).length;
  return enScore > itScore ? "en" : "it";
}
