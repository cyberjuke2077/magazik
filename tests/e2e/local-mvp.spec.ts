import { PrismaClient } from '@prisma/client'
import { expect, test, type Page } from '@playwright/test'

const localMvpEnabled = process.env.E2E_LOCAL_MVP === '1'

test.skip(!localMvpEnabled, 'Run with npm run test:e2e:local against the local MVP database')

test.afterAll(async () => {
  if (!localMvpEnabled) return
  assertLocalDatabase()
  const prisma = new PrismaClient()
  try {
    await prisma.submissionRateLimit.deleteMany({
      where: {
        scope: { in: ['quote_request', 'wholesale_lead', 'admin_login'] },
      },
    })
  } finally {
    await prisma.$disconnect()
  }
})

function assertLocalDatabase(): void {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is required')

  const host = new URL(databaseUrl).hostname
  if (host !== '127.0.0.1' && host !== 'localhost' && host !== '[::1]') {
    throw new Error(`Refusing to run the write test against non-local host: ${host}`)
  }
}

test('health endpoint confirms application and database readiness', async ({ request }) => {
  assertLocalDatabase()

  const response = await request.get('/api/health')
  expect(response.status()).toBe(200)
  await expect(response.json()).resolves.toEqual({ status: 'ok', database: 'ok' })
  expect(response.headers()['cache-control']).toContain('no-store')
})

async function loginAdmin(page: Page, destination: '/admin/requests' | '/admin/wholesale') {
  await page.goto(destination)
  await expect(page).toHaveURL(/\/admin\/login/)
  await page.getByPlaceholder('Логин').fill('mvp-admin')
  await page.getByPlaceholder('Пароль').fill('local-e2e-password')
  await page.getByRole('button', { name: 'Войти' }).click()
  await expect(page).toHaveURL(destination)
}

test('товар проходит путь от каталога до сохраненной заявки', async ({ page }, testInfo) => {
  assertLocalDatabase()

  const prisma = new PrismaClient()
  const email = `mvp-e2e-${testInfo.project.name}@local.test`
  let requestId: string | null = null

  try {
    await prisma.quoteRequest.deleteMany({ where: { email } })

    await page.goto('/catalog?q=TPS5430')
    const productCard = page.locator('article').filter({ hasText: 'TPS5430DDAR' })
    await expect(productCard).toBeVisible()
    await productCard.getByText('Понижающий преобразователь TPS5430DDAR', { exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Понижающий преобразователь TPS5430DDAR' })).toBeVisible()
    await expect(page.getByText('Входное напряжение', { exact: true })).toBeVisible()
    await expect(page.getByRole('img', { name: /TPS5430DDAR/ }).first()).toBeVisible()
    const datasheetLink = page.getByRole('link', { name: /TPS5430, TPS5431 Datasheet/ }).first()
    await expect(datasheetLink).toBeVisible()
    await expect(datasheetLink).toHaveAttribute(
      'href',
      'https://www.ti.com/lit/ds/symlink/tps5430.pdf',
    )
    await page.getByRole('button', { name: 'Добавить в корзину' }).click()
    await expect
      .poll(() =>
        page.evaluate(() => {
          const raw = window.localStorage.getItem('electromagaz_cart')
          if (!raw) return null
          const cart = JSON.parse(raw) as Array<{ product?: { partNumber?: string } }>
          return cart[0]?.product?.partNumber ?? null
        }),
      )
      .toBe('TPS5430DDAR')

    await page.goto('/catalog?q=STM32F103')
    const secondProduct = page.locator('article').filter({ hasText: 'STM32F103C8T6' })
    await expect(secondProduct).toBeVisible()
    await secondProduct.getByRole('button', { name: 'Добавить в корзину' }).click()
    await expect(secondProduct.getByRole('button', { name: 'Товар в корзине' })).toBeVisible()

    await page.getByRole('link', { name: 'Корзина', exact: true }).first().click()
    await expect(page.getByText('TPS5430DDAR', { exact: true })).toBeVisible()
    await expect(page.getByText('STM32F103C8T6', { exact: true })).toBeVisible()
    const quantity = page.getByRole('textbox', { name: 'Количество TPS5430DDAR' })
    await quantity.fill('11')
    await quantity.press('Enter')
    await page.reload()
    await expect(page.getByRole('textbox', { name: 'Количество TPS5430DDAR' })).toHaveValue('11')
    await page.getByRole('link', { name: 'Перейти к оформлению' }).click()

    await page.getByLabel('Название компании').fill('ООО Локальный MVP')
    await page.getByLabel('ИНН').fill('1234567890')
    await page.getByLabel('Контактное лицо').fill('Тестовый Пользователь')
    await page.getByLabel('Телефон').fill('+7 999 000-00-00')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel(/Я даю согласие/).check()
    await page.getByRole('button', { name: 'Отправить заявку' }).click()

    await expect(page).toHaveURL(/\/request-quote\/status\/[a-z0-9]+$/)
    const publicStatusUrl = page.url()
    requestId = page.url().split('/').pop() ?? null
    expect(requestId).toBeTruthy()
    await expect(page.getByRole('heading', { name: 'Статус заявки' })).toBeVisible()

    const saved = await prisma.quoteRequest.findUnique({
      where: { id: requestId ?? '' },
      include: { items: true },
    })

    expect(saved?.companyName).toBe('ООО Локальный MVP')
    expect(saved?.consentAt).not.toBeNull()
    expect(saved?.items).toHaveLength(2)
    expect(saved?.items.find((item) => item.partNumber === 'TPS5430DDAR')?.quantity).toBe(11)
    expect(saved?.items.some((item) => item.partNumber === 'STM32F103C8T6')).toBe(true)

    await loginAdmin(page, '/admin/requests')
    await page.locator(`a[href="/admin/requests/${requestId}"]`).click()
    await page.getByLabel('Статус заявки').selectOption('quoted')
    await expect
      .poll(async () =>
        (await prisma.quoteRequest.findUnique({ where: { id: requestId ?? '' } }))?.status,
      )
      .toBe('quoted')

    const statusResponse = await page.goto(publicStatusUrl)
    expect(statusResponse?.headers()['cache-control']).toMatch(/no-cache|no-store/)
    expect(statusResponse?.headers()['referrer-policy']).toBe('no-referrer')
    expect(statusResponse?.headers()['x-robots-tag']).toContain('noindex')
    await expect(page.getByText('КП готово', { exact: true })).toBeVisible()
    await expect(page.getByText(email, { exact: true })).toHaveCount(0)
    await expect(page.getByText('+7 999 000-00-00', { exact: true })).toHaveCount(0)
  } finally {
    await prisma.quoteRequest.deleteMany({ where: { email } })
    await prisma.$disconnect()
  }
})

test('оптовая форма сохраняет лид и показывает его менеджеру', async ({ page }, testInfo) => {
  assertLocalDatabase()

  const prisma = new PrismaClient()
  const email = `wholesale-e2e-${testInfo.project.name}@local.test`

  try {
    await prisma.wholesaleLead.deleteMany({ where: { email } })

    await page.goto('/wholesale')
    await page.getByLabel('Имя *', { exact: true }).fill('Оптовый Тест')
    await page.getByRole('textbox', { name: 'Компания', exact: true }).fill('ООО Оптовый MVP')
    await page.getByLabel('Email *', { exact: true }).fill(email)
    await page.getByLabel('Телефон *', { exact: true }).fill('+7 999 111-22-33')
    await page.getByLabel('Сообщение', { exact: true }).fill('Проверка локального оптового лида')
    await page.getByLabel(/Я соглашаюсь на обработку/).check()
    await page.getByRole('button', { name: 'Отправить заявку' }).click()
    await expect(page.getByRole('heading', { name: 'Заявка отправлена!' })).toBeVisible()

    await expect
      .poll(() => prisma.wholesaleLead.count({ where: { email } }))
      .toBe(1)

    await loginAdmin(page, '/admin/wholesale')
    await expect(page.getByText('ООО Оптовый MVP', { exact: true })).toBeVisible()
    await expect(page.getByText('Проверка локального оптового лида', { exact: true })).toBeVisible()
  } finally {
    await prisma.wholesaleLead.deleteMany({ where: { email } })
    await prisma.$disconnect()
  }
})

test('админская сессия защищена и удаляется при выходе', async ({ page, context }) => {
  assertLocalDatabase()

  await loginAdmin(page, '/admin/requests')
  const sessionCookie = (await context.cookies()).find((cookie) => cookie.name === 'emg_admin')
  expect(sessionCookie).toBeDefined()
  expect(sessionCookie?.httpOnly).toBe(true)
  expect(sessionCookie?.sameSite).toBe('Lax')

  await page.getByRole('button', { name: 'Выйти' }).click()
  await expect(page).toHaveURL(/\/admin\/login/)
  expect((await context.cookies()).some((cookie) => cookie.name === 'emg_admin')).toBe(false)

  await page.goto('/admin/requests')
  await expect(page).toHaveURL(/\/admin\/login/)

  await context.addCookies([
    {
      name: 'emg_admin',
      value: 'tampered.session',
      domain: '127.0.0.1',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ])
  await page.goto('/admin/requests')
  await expect(page).toHaveURL(/\/admin\/login/)
})
