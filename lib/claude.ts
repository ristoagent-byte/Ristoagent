import Groq from "groq-sdk";
import type { Business, Message } from "@/types";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY_RISTOAGENT_BOT });

const MODEL = "llama-3.3-70b-versatile";

function buildSystemPrompt(business: Business, language: "it" | "en"): string {
  const now = new Date();
  const today = now.toLocaleDateString("en-CA", { timeZone: "Europe/Rome" });
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

const tools: Groq.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "check_availability",
      description: "Check if a date and time slot is available in the business calendar",
      parameters: {
        type: "object",
        properties: {
          date: { type: "string", description: "Date in YYYY-MM-DD format" },
          time: { type: "string", description: "Time in HH:MM format (24h)" },
          duration_minutes: { type: "number", description: "Duration in minutes (default 90)" },
        },
        required: ["date", "time"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_booking",
      description: "Create a confirmed booking in the business calendar",
      parameters: {
        type: "object",
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

  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...history.slice(-20).map((m): Groq.Chat.ChatCompletionMessageParam => ({
      role: m.sender === "customer" ? "user" : "assistant",
      content: m.text,
    })),
    { role: "user", content: newMessage },
  ];

  const toolCalls: ChatResult["toolCalls"] = [];

  while (true) {
    const response = await groq.chat.completions.create({
      model: MODEL,
      messages,
      tools,
      tool_choice: "auto",
    });

    const choice = response.choices[0];
    const assistantMessage = choice.message;
    messages.push(assistantMessage);

    if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
      return { reply: assistantMessage.content ?? "", toolCalls };
    }

    for (const tc of assistantMessage.tool_calls) {
      const name = tc.function.name;
      const input = JSON.parse(tc.function.arguments) as Record<string, unknown>;
      const result = await toolHandler(name, input);
      toolCalls.push({ name, input, result });
      messages.push({
        role: "tool",
        tool_call_id: tc.id,
        content: JSON.stringify(result),
      });
    }
  }
}

export function detectLanguage(text: string): "it" | "en" {
  const englishWords = /\b(hello|hi|hey|please|thank|thanks|book|booking|available|availability|what|when|where|how|can|could|would|is|are|do|does|have|has|the|and|for|with|this|that|your|you|me|my|want|need|help|open|close|price|cost)\b/i;
  const italianWords = /\b(ciao|grazie|buon|vorrei|sono|siete|avete|per|con|una|uno|della|del|che|non|ho|ha|salve|buongiorno|buonasera|prenot|orari|servizi|disponib|quanto|quando|dove|come|posso|voglio|mi|il|la|lo|le|gli|un|una|questo|quello)\b/i;
  const itScore = (text.match(italianWords) ?? []).length;
  const enScore = (text.match(englishWords) ?? []).length;
  return enScore > itScore ? "en" : "it";
}
