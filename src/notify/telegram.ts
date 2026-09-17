export interface TelegramConfig {
  botToken: string;
  chatId: string;
}

/** Sends a plain-text message via the Telegram Bot API. Throws on non-2xx responses. */
export async function sendTelegramMessage(config: TelegramConfig, text: string): Promise<void> {
  const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: config.chatId,
      text,
      disable_web_page_preview: true,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Telegram API error ${res.status}: ${body}`);
  }
}
