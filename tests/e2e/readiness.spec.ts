import { PrismaClient } from '@prisma/client'
import { expect, test } from '@playwright/test'

test.skip(process.env.E2E_LOCAL_MVP !== '1', 'Requires an isolated local database')
function database() {
  const url = new URL(process.env.DATABASE_URL ?? '')
  if (!['localhost', '127.0.0.1'].includes(url.hostname) || url.pathname !== '/emg_readiness') throw new Error('Isolated database required')
  return new PrismaClient()
}

test('punctuation search renders a usable catalog, and the specification CTA opens a real form', async ({ page }) => {
  await page.goto('/catalog?q=%21%21')
  await expect(page.getByText('Произошла ошибка', { exact: false })).toHaveCount(0)
  await expect(page.locator('main')).toBeVisible()
  await page.goto('/')
  await page.getByRole('link').filter({ hasText: 'Пришлите список MPN' }).click()
  await expect(page).toHaveURL(/\/wholesale#request-form$/)
  await expect(page.getByLabel('Список компонентов и пожелания')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('lost server response unlocks the form and retry creates no duplicate', async ({ page }, testInfo) => {
  const prisma = database()
  const email = `retry-${testInfo.project.name}-${Date.now()}@example.invalid`
  try {
    await page.goto('/wholesale#request-form')
    await page.getByLabel('Имя *', { exact: true }).fill('Retry Test')
    await page.getByLabel('Email *', { exact: true }).fill(email)
    await page.getByLabel('Телефон *', { exact: true }).fill('79990000000')
    await page.getByLabel('Список компонентов и пожелания').fill('MISSING-MPN-TEST; 100 шт.')
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
    await expect(page.getByRole('button', { name: 'Отправить заявку' })).toBeEnabled()
    await expect(page.getByLabel('Email *', { exact: true })).toHaveValue(email)
    await expect.poll(() => prisma.wholesaleLead.count({ where: { email } })).toBe(1)
    await page.getByRole('button', { name: 'Отправить заявку' }).click()
    await expect(page.getByRole('heading', { name: 'Заявка отправлена!' })).toBeVisible()
    expect(await prisma.wholesaleLead.count({ where: { email } })).toBe(1)
    await page.screenshot({ path: testInfo.outputPath('wholesale-success.png'), fullPage: true })
  } finally {
    const ids = (await prisma.wholesaleLead.findMany({ where: { email }, select: { id: true } })).map((row) => row.id)
    await prisma.notificationJob.deleteMany({ where: { requestId: { in: ids } } })
    await prisma.submissionReceipt.deleteMany({ where: { requestId: { in: ids } } })
    await prisma.wholesaleLead.deleteMany({ where: { email } })
    await prisma.$disconnect()
  }
})

test('quote line totals match wholesale pricing and an unknown item prevents a misleading total', async ({ page }) => {
  await page.goto('/cart')
  await page.evaluate(() => {
    const product = { id: 'synthetic-priced', slug: 'priced', name: 'Pricing test', partNumber: 'PRICED', manufacturer: 'Test',
      category: 'Test', price: 100, priceWholesale: 80, currency: 'RUB', minOrder: 10, unit: 'шт', tags: [], specs: {}, description: '', inStock: false, stockCount: 0 }
    localStorage.setItem('electromagaz_cart', JSON.stringify([{product, quantity:10}]))
  })
  await page.goto('/request-quote')
  await expect(page.getByText(/10 × 80/)).toBeVisible()
  await expect(page.getByText('Предварительная сумма:').locator('..')).toContainText(/800/)
  await page.evaluate(() => {
    const items = JSON.parse(localStorage.getItem('electromagaz_cart')!)
    items.push({ product: {...items[0].product, id: 'synthetic-unknown', name: 'Unknown test', price:0, priceWholesale:undefined}, quantity:10 })
    localStorage.setItem('electromagaz_cart', JSON.stringify(items))
  })
  await page.reload()
  await expect(page.getByText('Предварительная сумма:').locator('..')).toContainText('По запросу')
  await page.screenshot({path: test.info().outputPath('quote-mixed-prices.png'), fullPage:true})
})

test('manager can find and update a wholesale lead older than the first 100', async ({ page }, testInfo) => {
  const prisma = database()
  const marker = `pagination-${testInfo.project.name}-${Date.now()}`
  try {
    await prisma.wholesaleLead.createMany({ data: Array.from({ length: 101 }, (_, index) => ({
      id: `${marker}-${index}`, name: `${marker}-${index}`, phone:'79990000000', email:'test@example.invalid',
      createdAt: new Date(946684800000 + index * 1000),
    })) })
    await page.goto('/admin/wholesale')
    await page.getByPlaceholder('Логин').fill('mvp-admin')
    await page.getByPlaceholder('Пароль').fill('local-e2e-password')
    await page.getByRole('button', { name: 'Войти' }).click()
    await expect(page).toHaveURL(/\/admin\/wholesale/)
    await page.getByRole('link', { name: 'Далее', exact: true }).click()
    await page.getByRole('link', { name: 'Далее', exact: true }).click()
    const row = page.getByRole('row').filter({hasText: `${marker}-0`})
    await expect(row).toBeVisible()
    await row.getByLabel('Статус оптовой заявки').selectOption('closed')
    await expect.poll(async () => (await prisma.wholesaleLead.findUnique({where:{id:`${marker}-0`}}))?.status).toBe('closed')
  } finally {
    await prisma.wholesaleLead.deleteMany({where:{id:{startsWith:marker}}})
    await prisma.$disconnect()
  }
})
