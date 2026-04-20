const TELEGRAM_API = "https://api.telegram.org/bot";

export async function sendMessage(
  botToken: string,
  chatId: number | string,
  text: string
): Promise<void> {
  const url = `${TELEGRAM_API}${botToken}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    }),
  });
}

export async function sendMessageWithKeyboard(
  botToken: string,
  chatId: number | string,
  text: string,
  keyboard: { inline_keyboard: { text: string; callback_data: string }[][] }
): Promise<void> {
  const url = `${TELEGRAM_API}${botToken}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      reply_markup: keyboard,
    }),
  });
}

export async function answerCallbackQuery(
  botToken: string,
  callbackQueryId: string
): Promise<void> {
  const url = `${TELEGRAM_API}${botToken}/answerCallbackQuery`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId }),
  });
}

export async function setWebhook(
  botToken: string,
  webhookUrl: string,
  secret: string
): Promise<{ ok: boolean; description?: string }> {
  const url = `${TELEGRAM_API}${botToken}/setWebhook`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: secret,
      allowed_updates: ["message", "callback_query"],
    }),
  });
  return res.json();
}

export async function getBotInfo(
  botToken: string
): Promise<{ ok: boolean; result?: { username: string; first_name: string } }> {
  const url = `${TELEGRAM_API}${botToken}/getMe`;
  const res = await fetch(url);
  return res.json();
}

export function verifyWebhookSecret(
  request: Request,
  expectedSecret: string
): boolean {
  const incoming = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
  return incoming === expectedSecret;
}

export async function sendMonitorAlert(text: string): Promise<void> {
  const botToken = process.env.MONITOR_BOT_TOKEN;
  const chatId = process.env.MONITOR_OWNER_CHAT_ID;
  if (!botToken || !chatId) return;
  await sendMessage(botToken, chatId, text);
}
