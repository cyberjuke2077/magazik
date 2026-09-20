import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { notifyNewQuoteRequest } from './notifications'

const originalTelegramToken = process.env.TELEGRAM_BOT_TOKEN
const originalTelegramChatId = process.env.TELEGRAM_CHAT_ID

const notification = {
  requestId: 'request-1',
  companyName: 'ООО Тест',
  contactPerson: 'Иван',
  phone: '+7 900 000-00-00',
  email: 'buyer@example.ru',
  itemsCount: 2,
}

describe('Telegram notifications', () => {
  beforeEach(() => {
    delete process.env.TELEGRAM_BOT_TOKEN
    delete process.env.TELEGRAM_CHAT_ID
  })

  afterEach(() => {
    if (originalTelegramToken === undefined) delete process.env.TELEGRAM_BOT_TOKEN
    else process.env.TELEGRAM_BOT_TOKEN = originalTelegramToken
    if (originalTelegramChatId === undefined) delete process.env.TELEGRAM_CHAT_ID
    else process.env.TELEGRAM_CHAT_ID = originalTelegramChatId
    vi.unstubAllGlobals()
  })

  it('reports missing configuration explicitly without a network request', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(notifyNewQuoteRequest(notification)).resolves.toEqual({
      status: 'not_configured',
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('reports successful delivery', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'test-token'
    process.env.TELEGRAM_CHAT_ID = 'test-chat'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"ok":true}', { status: 200 })))

    await expect(notifyNewQuoteRequest(notification)).resolves.toEqual({ status: 'sent' })
    const body = vi.mocked(fetch).mock.calls[0][1]?.body as string
    expect(body).not.toContain(notification.phone)
    expect(body).not.toContain(notification.email)
    expect(body).not.toContain(notification.contactPerson)
    expect(body).not.toContain(notification.companyName)
  })

  it('reports Telegram failure without throwing', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'test-token'
    process.env.TELEGRAM_CHAT_ID = 'test-chat'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 503 })))

    await expect(notifyNewQuoteRequest(notification)).resolves.toEqual({
      status: 'failed',
      errorType: 'TelegramHttp503',
    })
  })
})

it('does not consider an HTTP 200 API rejection delivered', async () => {
  process.env.TELEGRAM_BOT_TOKEN = 'test-token'
  process.env.TELEGRAM_CHAT_ID = 'test-chat'
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"ok":false}', {status:200})))
  try {
    await expect(notifyNewQuoteRequest(notification)).resolves.toEqual({status:'failed',errorType:'TelegramRejected'})
  } finally {
    if (originalTelegramToken === undefined) delete process.env.TELEGRAM_BOT_TOKEN
    else process.env.TELEGRAM_BOT_TOKEN = originalTelegramToken
    if (originalTelegramChatId === undefined) delete process.env.TELEGRAM_CHAT_ID
    else process.env.TELEGRAM_CHAT_ID = originalTelegramChatId
    vi.unstubAllGlobals()
  }
})
