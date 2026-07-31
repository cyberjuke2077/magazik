/**
 * Уведомления о событиях магазина. Сейчас — Telegram.
 *
 * Env:
 *   TELEGRAM_BOT_TOKEN - токен бота от @BotFather
 *   TELEGRAM_CHAT_ID   - id чата получателя
 */

interface QuoteNotification {
  requestId: string
  companyName: string
  contactPerson: string
  phone: string
  email: string
  itemsCount: number
  comment?: string | null
}

interface WholesaleNotification {
  leadId: string
  name: string
  company?: string | null
  phone: string
  email: string
  message?: string | null
}

export type NotificationDelivery =
  | { status: 'sent' }
  | { status: 'not_configured' }
  | { status: 'failed'; errorType: string }

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Низкоуровневая отправка в Telegram. Никогда не бросает исключение -
 * сбой уведомления не должен ломать бизнес-операцию (сохранение заявки/лида).
 * Результат возвращается вызывающему коду для структурированного лога.
 */
async function sendTelegram(text: string): Promise<NotificationDelivery> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return { status: 'not_configured' }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) {
      return { status: 'failed', errorType: `TelegramHttp${res.status}` }
    }
    return { status: 'sent' }
  } catch (e) {
    return {
      status: 'failed',
      errorType: e instanceof Error ? e.name : 'UnknownError',
    }
  }
}

/** Уведомление о новой заявке на КП. */
export async function notifyNewQuoteRequest(q: QuoteNotification): Promise<NotificationDelivery> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const text = [
    '🔔 <b>Новая заявка на КП</b>',
    '',
    `<b>Компания:</b> ${escapeHtml(q.companyName)}`,
    `<b>Контакт:</b> ${escapeHtml(q.contactPerson)}`,
    `<b>Телефон:</b> ${escapeHtml(q.phone)}`,
    `<b>Email:</b> ${escapeHtml(q.email)}`,
    `<b>Позиций:</b> ${q.itemsCount}`,
    ...(q.comment ? [`<b>Комментарий:</b> ${escapeHtml(q.comment)}`] : []),
    '',
    `${baseUrl}/admin/requests/${q.requestId}`,
  ].join('\n')

  return sendTelegram(text)
}

/** Уведомление о новой оптовой заявке (страница /wholesale). */
export async function notifyNewWholesaleLead(w: WholesaleNotification): Promise<NotificationDelivery> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const text = [
    '🟠 <b>Новая оптовая заявка</b>',
    '',
    `<b>Имя:</b> ${escapeHtml(w.name)}`,
    ...(w.company ? [`<b>Компания:</b> ${escapeHtml(w.company)}`] : []),
    `<b>Телефон:</b> ${escapeHtml(w.phone)}`,
    `<b>Email:</b> ${escapeHtml(w.email)}`,
    ...(w.message ? [`<b>Сообщение:</b> ${escapeHtml(w.message)}`] : []),
    '',
    `${baseUrl}/admin/wholesale`,
  ].join('\n')

  return sendTelegram(text)
}
