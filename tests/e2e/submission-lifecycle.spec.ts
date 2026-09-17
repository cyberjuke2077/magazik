import { PrismaClient } from '@prisma/client'
import { expect, test } from '@playwright/test'

test.skip(process.env.E2E_LOCAL_MVP !== '1', 'Requires an isolated local database')

const WHOLESALE_RATE_SCOPES = [
  'wholesale_lead',
  'wholesale_lead_attempt_global',
  'wholesale_lead_attempt_network',
]
const QUOTE_RATE_SCOPES = [
  'quote_request',
  'quote_request_attempt_global',
  'quote_request_attempt_network',
]

function database() {
  const url = new URL(process.env.DATABASE_URL ?? '')
  if (!['localhost', '127.0.0.1'].includes(url.hostname) || url.pathname !== '/emg_readiness') {
    throw new Error('Isolated database required')
  }
  return new PrismaClient()
}

test('wholesale retry resolves the original operation, preserves its draft, and allows a later identical request', async ({ page }, testInfo) => {
  const prisma = database()
  const marker = `lifecycle-${testInfo.project.name}-${Date.now()}`
  const email = `${marker}@example.invalid`
  const phone = '79990000000'
  try {
    await prisma.submissionRateLimit.deleteMany({ where: { scope: { in: WHOLESALE_RATE_SCOPES } } })
    await page.goto('/wholesale#request-form')
    await page.getByLabel('Имя *', { exact: true }).fill('Lifecycle Test')
    await page.getByLabel('Email *', { exact: true }).fill(email)
    await page.getByLabel('Телефон *', { exact: true }).fill(phone)
    await page.getByLabel('Список компонентов и пожелания').fill(marker)
    await page.getByLabel(/Я соглашаюсь на обработку/).check()

    let dropped = false
    await page.route('**/wholesale', async (route) => {
      if (!dropped && route.request().method() === 'POST') {
        dropped = true
        await route.fetch()
        await route.abort('failed')
      } else await route.continue()
    })
    await page.getByRole('button', { name: 'Отправить заявку' }).click()
    await expect(page.getByText(/Связь прервалась/)).toBeVisible()
    await expect.poll(() => prisma.wholesaleLead.count({ where: { email } })).toBe(1)

    await page.reload()
    await expect(page.getByLabel('Email *', { exact: true })).toHaveValue(email)
    await expect(page.getByLabel('Список компонентов и пожелания')).toHaveValue(marker)
    await expect(page.getByLabel(/Я соглашаюсь на обработку/)).not.toBeChecked()

    await page.getByLabel('Телефон *', { exact: true }).fill('79990000001')
    await page.getByLabel(/Я соглашаюсь на обработку/).check()
    await page.getByRole('button', { name: 'Отправить заявку' }).click()
    await expect(page.getByText(/Изменённые данные не отправлены/)).toBeVisible()
    expect(await prisma.wholesaleLead.count({ where: { email } })).toBe(1)

    await page.getByRole('button', { name: 'Проверить статус предыдущей отправки' }).click()
    await expect(page.getByRole('heading', { name: 'Заявка отправлена!' })).toBeVisible()
    const first = await prisma.wholesaleLead.findFirstOrThrow({ where: { email } })
    await expect(page.getByText(`№ ${first.id}`)).toBeVisible()

    await page.getByRole('button', { name: 'Создать ещё одну заявку' }).click()
    await page.getByLabel('Телефон *', { exact: true }).fill(phone)
    await page.getByLabel(/Я соглашаюсь на обработку/).check()
    await page.getByRole('button', { name: 'Отправить заявку' }).click()
    await expect(page.getByRole('heading', { name: 'Заявка отправлена!' })).toBeVisible()

    const requests = await prisma.wholesaleLead.findMany({ where: { email }, orderBy: { createdAt: 'asc' } })
    expect(requests).toHaveLength(2)
    expect(requests[1].id).not.toBe(requests[0].id)
    expect(await prisma.notificationJob.count({ where: { requestId: { in: requests.map((item) => item.id) } } })).toBe(2)

    const statusLink = page.getByRole('link', { name: 'Проверить статус' })
    const statusHref = await statusLink.getAttribute('href')
    expect(statusHref).toBe(`/wholesale/status/${requests[1].id}`)
    const statusResponse = await page.goto(statusHref!)
    await expect(page).toHaveURL(new RegExp(`/wholesale/status/${requests[1].id}$`))
    await expect(page.getByRole('heading', { name: 'Статус оптовой заявки' })).toBeVisible()
    await expect(page.getByText(email)).toHaveCount(0)
    await expect(page.getByText(marker)).toHaveCount(0)
    expect(statusResponse?.headers()['referrer-policy']).toBe('no-referrer')
    expect(statusResponse?.headers()['x-robots-tag']).toBe('noindex, nofollow, noarchive')
    expect(statusResponse?.headers()['cache-control']).toMatch(/no-store|no-cache|private/)

    await page.goto('/account')
    await expect(page.getByRole('link', { name: new RegExp(requests[0].id) })).toBeVisible()
    await expect(page.getByRole('link', { name: new RegExp(requests[1].id) })).toBeVisible()

    await page.goto('/wholesale#request-form')
    await expect(page.getByLabel('Email *', { exact: true })).toHaveValue('')
  } finally {
    const ids = (await prisma.wholesaleLead.findMany({ where: { email }, select: { id: true } })).map((row) => row.id)
    await prisma.notificationJob.deleteMany({ where: { requestId: { in: ids } } })
    await prisma.submissionReceipt.deleteMany({ where: { requestId: { in: ids } } })
    await prisma.wholesaleLead.deleteMany({ where: { email } })
    await prisma.submissionRateLimit.deleteMany({ where: { scope: { in: WHOLESALE_RATE_SCOPES } } })
    await prisma.$disconnect()
  }
})

test('missing wholesale receipt is checked without mutation and changed data needs an explicit new operation', async ({ page }, testInfo) => {
  const prisma = database()
  const marker = `missing-receipt-${testInfo.project.name}-${Date.now()}`
  const email = `${marker}@example.invalid`
  const originalPhone = '79990000010'
  const changedPhone = '79990000011'
  let originalKey = ''
  try {
    await prisma.submissionRateLimit.deleteMany({ where: { scope: { in: WHOLESALE_RATE_SCOPES } } })
    await page.goto('/wholesale#request-form')
    await page.getByLabel('Имя *', { exact: true }).fill('Missing Receipt Test')
    await page.getByLabel('Email *', { exact: true }).fill(email)
    await page.getByLabel('Телефон *', { exact: true }).fill(originalPhone)
    await page.getByLabel('Список компонентов и пожелания').fill(marker)
    await page.getByLabel(/Я соглашаюсь на обработку/).check()

    let aborted = false
    await page.route('**/wholesale', async (route) => {
      if (!aborted && route.request().method() === 'POST') {
        aborted = true
        await route.abort('failed')
      } else await route.continue()
    })
    await page.getByRole('button', { name: 'Отправить заявку' }).click()
    await expect(page.getByText(/Связь прервалась/)).toBeVisible()
    originalKey = await page.evaluate(() => {
      const raw = sessionStorage.getItem('electromagaz_submission_wholesale')
      return raw ? JSON.parse(raw).key as string : ''
    })
    expect(originalKey).toMatch(/^[0-9a-f-]{36}$/)
    expect(await prisma.wholesaleLead.count({ where: { email } })).toBe(0)

    await page.getByLabel('Телефон *', { exact: true }).fill(changedPhone)
    await page.getByRole('button', { name: 'Отправить заявку' }).click()
    await expect(page.getByText(/Изменённые данные не отправлены/)).toBeVisible()
    await page.getByRole('button', { name: 'Проверить статус предыдущей отправки' }).click()

    await expect(page.getByRole('button', { name: 'Повторить исходную отправку' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Отправить изменённые данные новой заявкой' })).toBeVisible()
    expect(await prisma.wholesaleLead.count({ where: { email } })).toBe(0)
    expect(await prisma.submissionReceipt.findUnique({ where: { key: originalKey } })).toBeNull()

    await page.getByRole('button', { name: 'Отправить изменённые данные новой заявкой' }).click()
    await expect(page.getByRole('heading', { name: 'Заявка отправлена!' })).toBeVisible()
    const lead = await prisma.wholesaleLead.findFirstOrThrow({ where: { email } })
    expect(lead.phone).toBe(changedPhone)
    expect(await prisma.submissionReceipt.findUnique({ where: { key: originalKey } })).toBeNull()
  } finally {
    const ids = (await prisma.wholesaleLead.findMany({ where: { email }, select: { id: true } })).map((row) => row.id)
    await prisma.notificationJob.deleteMany({ where: { requestId: { in: ids } } })
    await prisma.submissionReceipt.deleteMany({ where: { requestId: { in: ids } } })
    await prisma.wholesaleLead.deleteMany({ where: { email } })
    await prisma.submissionRateLimit.deleteMany({ where: { scope: { in: WHOLESALE_RATE_SCOPES } } })
    await prisma.$disconnect()
  }
})

test('server validation rejection discards its operation so corrected data can be submitted', async ({ page }, testInfo) => {
  const prisma = database()
  const marker = `validation-retry-${testInfo.project.name}-${Date.now()}`
  const email = `${marker}@example.invalid`
  try {
    await prisma.submissionRateLimit.deleteMany({ where: { scope: { in: WHOLESALE_RATE_SCOPES } } })
    await page.goto('/wholesale#request-form')
    await page.getByLabel('Имя *', { exact: true }).fill('Validation Retry')
    await page.getByLabel('Email *', { exact: true }).fill(email)
    await page.getByLabel('Телефон *', { exact: true }).fill('79990000012')
    await page.getByLabel('Список компонентов и пожелания').fill(marker)
    await expect.poll(() => page.evaluate(() => (
      sessionStorage.getItem('electromagaz_submission_draft_wholesale') !== null
    ))).toBe(true)
    await page.evaluate(() => {
      const key = 'electromagaz_submission_draft_wholesale'
      const draft = JSON.parse(sessionStorage.getItem(key) ?? '{}')
      draft.expiresAt = Date.now() - 1
      sessionStorage.setItem(key, JSON.stringify(draft))
      window.dispatchEvent(new Event('focus'))
    })
    await expect(page.getByLabel('Email *', { exact: true })).toHaveValue('')
    await expect(page.getByLabel('Телефон *', { exact: true })).toHaveValue('')
    await expect(page.getByText(/Срок хранения черновика истёк/)).toBeVisible()

    await page.getByLabel('Имя *', { exact: true }).fill('Validation Retry')
    await page.getByLabel('Email *', { exact: true }).fill(email)
    await page.getByLabel('Телефон *', { exact: true }).fill('abc')
    await page.getByLabel('Список компонентов и пожелания').fill(marker)
    await page.getByLabel(/Я соглашаюсь на обработку/).check()
    await page.getByRole('button', { name: 'Отправить заявку' }).click()

    await expect(page.getByText('Некорректный телефон')).toBeVisible()
    expect(await page.evaluate(() => sessionStorage.getItem('electromagaz_submission_wholesale'))).toBeNull()
    expect(await prisma.wholesaleLead.count({ where: { email } })).toBe(0)

    await page.getByLabel('Телефон *', { exact: true }).fill('79990000012')
    await page.getByRole('button', { name: 'Отправить заявку' }).click()
    await expect(page.getByRole('heading', { name: 'Заявка отправлена!' })).toBeVisible()
    expect(await prisma.wholesaleLead.count({ where: { email } })).toBe(1)
  } finally {
    const ids = (await prisma.wholesaleLead.findMany({ where: { email }, select: { id: true } })).map((row) => row.id)
    await prisma.notificationJob.deleteMany({ where: { requestId: { in: ids } } })
    await prisma.submissionReceipt.deleteMany({ where: { requestId: { in: ids } } })
    await prisma.wholesaleLead.deleteMany({ where: { email } })
    await prisma.submissionRateLimit.deleteMany({ where: { scope: { in: WHOLESALE_RATE_SCOPES } } })
    await prisma.$disconnect()
  }
})

test('quote replay survives reload after the current cart was cleared', async ({ page }, testInfo) => {
  const prisma = database()
  const email = `quote-replay-${testInfo.project.name}-${Date.now()}@example.invalid`
  const product = await prisma.product.findFirstOrThrow({ where: { partNumber: 'TPS5430DDAR' } })
  try {
    await prisma.submissionRateLimit.deleteMany({ where: { scope: { in: QUOTE_RATE_SCOPES } } })
    await page.goto('/')
    const snapshot = await page.evaluate(async (productId) => {
      const response = await fetch('/api/cart/products', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ids: [productId] }),
      })
      return (await response.json()).products[0]
    }, product.id)
    await page.evaluate(({ productId, quantity, productSnapshot }) => {
      localStorage.setItem('electromagaz_cart', JSON.stringify({
        version: 1,
        items: [{ productId, quantity, snapshot: productSnapshot }],
      }))
    }, { productId: product.id, quantity: product.minOrder, productSnapshot: snapshot })
    await page.goto('/request-quote')
    await page.getByLabel('Название компании').fill('ООО Потерянный ответ')
    await page.getByLabel('ИНН').fill('1234567890')
    await page.getByLabel('Контактное лицо').fill('Тестовый Покупатель')
    await page.getByLabel('Телефон').fill('+7 999 000-00-13')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel(/согласие на обработку моих персональных/).check()

    let aborted = false
    await page.route('**/request-quote', async (route) => {
      if (!aborted && route.request().method() === 'POST') {
        aborted = true
        await route.abort('failed')
      } else await route.continue()
    })
    await page.getByRole('button', { name: 'Отправить заявку' }).click()
    await expect(page.getByText(/Связь прервалась/)).toBeVisible()
    expect(await prisma.quoteRequest.count({ where: { email } })).toBe(0)

    await page.evaluate(() => localStorage.removeItem('electromagaz_cart'))
    await page.reload()
    await expect(page.getByText(/Есть незавершённая отправка/)).toBeVisible()
    await page.getByRole('button', { name: 'Проверить статус предыдущей отправки' }).click()
    await page.getByRole('button', { name: 'Повторить исходную отправку' }).click()
    await expect(page).toHaveURL(/\/request-quote\/status\//)

    const request = await prisma.quoteRequest.findFirstOrThrow({
      where: { email },
      include: { items: true },
    })
    expect(request.items).toHaveLength(1)
    expect(request.items[0]).toMatchObject({ productId: product.id, quantity: product.minOrder })
  } finally {
    const ids = (await prisma.quoteRequest.findMany({ where: { email }, select: { id: true } })).map((row) => row.id)
    await prisma.notificationJob.deleteMany({ where: { requestId: { in: ids } } })
    await prisma.submissionReceipt.deleteMany({ where: { requestId: { in: ids } } })
    await prisma.quoteRequest.deleteMany({ where: { email } })
    await prisma.submissionRateLimit.deleteMany({ where: { scope: { in: QUOTE_RATE_SCOPES } } })
    await prisma.$disconnect()
  }
})

test('quote refreshes changed terms before mutation and submits the reconciled quantity only after review', async ({ page }, testInfo) => {
  const prisma = database()
  const email = `quote-refresh-${testInfo.project.name}-${Date.now()}@example.invalid`
  const product = await prisma.product.findFirstOrThrow({ where: { partNumber: 'TPS5430DDAR' } })
  const nextMinOrder = product.minOrder + 7
  try {
    await prisma.submissionRateLimit.deleteMany({ where: { scope: { in: QUOTE_RATE_SCOPES } } })
    await page.goto('/')
    const snapshot = await page.evaluate(async (productId) => {
      const response = await fetch('/api/cart/products', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ids: [productId] }),
      })
      const body = await response.json()
      return body.products[0]
    }, product.id)
    expect(snapshot).toBeTruthy()
    await page.evaluate(({ productId, quantity, productSnapshot }) => {
      localStorage.setItem('electromagaz_cart', JSON.stringify({
        version: 1,
        items: [{ productId, quantity, snapshot: productSnapshot }],
      }))
    }, { productId: product.id, quantity: product.minOrder, productSnapshot: snapshot })

    await page.goto('/request-quote')
    await expect(page.getByRole('heading', { name: 'Запрос коммерческого предложения' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Отправить заявку' })).toBeEnabled()
    await page.getByLabel('Название компании').fill('ООО Проверка корзины')
    await page.getByLabel('ИНН').fill('1234567890')
    await page.getByLabel('Контактное лицо').fill('Тестовый Покупатель')
    await page.getByLabel('Телефон').fill('+7 999 000-00-12')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel(/согласие на обработку моих персональных/).check()

    await prisma.product.update({
      where: { id: product.id },
      data: { price: 861.25, priceWholesale: 701.25, minOrder: nextMinOrder },
    })
    await page.getByRole('button', { name: 'Отправить заявку' }).click()

    await expect(page.getByText(new RegExp(`минимальная партия изменилась с ${product.minOrder} на ${nextMinOrder}`))).toBeVisible()
    expect(await prisma.quoteRequest.count({ where: { email } })).toBe(0)
    await page.getByRole('button', { name: 'Понятно' }).click()
    await page.getByRole('button', { name: 'Отправить заявку' }).click()
    await expect(page).toHaveURL(/\/request-quote\/status\//)

    const request = await prisma.quoteRequest.findFirstOrThrow({
      where: { email },
      include: { items: true },
    })
    expect(request.items).toHaveLength(1)
    expect(request.items[0].quantity).toBe(nextMinOrder)
  } finally {
    const ids = (await prisma.quoteRequest.findMany({ where: { email }, select: { id: true } })).map((row) => row.id)
    await prisma.notificationJob.deleteMany({ where: { requestId: { in: ids } } })
    await prisma.submissionReceipt.deleteMany({ where: { requestId: { in: ids } } })
    await prisma.quoteRequest.deleteMany({ where: { email } })
    await prisma.submissionRateLimit.deleteMany({ where: { scope: { in: QUOTE_RATE_SCOPES } } })
    await prisma.product.update({
      where: { id: product.id },
      data: { price: product.price, priceWholesale: product.priceWholesale, minOrder: product.minOrder },
    })
    await prisma.$disconnect()
  }
})
