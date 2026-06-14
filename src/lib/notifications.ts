/**
 * Уведомления о событиях магазина. Сейчас — Telegram.
 *
 * Env (опционально — без них уведомления тихо пропускаются):
 *   TELEGRAM_BOT_TOKEN — токен бота от @BotFather
 *   TELEGRAM_CHAT_ID   — id чата получателя
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

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Низкоуровневая отправка в Telegram. Никогда не бросает исключение —
 * сбой уведомления не должен ломать бизнес-операцию (сохранение заявки/лида).
 * Если env не заданы — тихо пропускаем (уведомления просто выключены).
 */
async function sendTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) {
      console.error('[notify] Telegram ответил', res.status, await res.text())
    }
  } catch (e) {
    console.error('[notify] Telegram недоступен:', e instanceof Error ? e.message : e)
  }
}

/** Уведомление о новой заявке на КП. */
export async function notifyNewQuoteRequest(q: QuoteNotification): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
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

  await sendTelegram(text)
}

/** Уведомление о новой оптовой заявке (страница /wholesale). */
export async function notifyNewWholesaleLead(w: WholesaleNotification): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
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

  await sendTelegram(text)
}
