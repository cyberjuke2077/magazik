import { PrismaClient } from '@prisma/client'
import { expect, test } from '@playwright/test'
import { currentBusinessDate } from '@/lib/delivery-date'

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

test('buyer client routes replace stale titles and use the Moscow delivery date', async ({ page }) => {
  await page.goto('/catalog?q=Texas')
  const row = page.locator('[data-catalog-product-row]').filter({ hasText: 'TPS5430DDAR' })
  await row.getByRole('button', { name: 'Добавить в корзину' }).click()
  await row.getByRole('button', { name: 'Перейти в корзину' }).click()
  await expect(page).toHaveURL(/\/cart$/)
  await expect(page).toHaveTitle('Корзина | Electromagaz')

  await page.getByRole('link', { name: 'Перейти к оформлению' }).click()
  await expect(page).toHaveURL(/\/request-quote$/)
  await expect(page).toHaveTitle('Запрос коммерческого предложения | Electromagaz')
  await expect(page.getByLabel('Желаемая дата поставки')).toHaveAttribute(
    'min',
    currentBusinessDate(),
  )

  await page.goto('/wholesale')
  await expect(page).toHaveTitle('Оптовые поставки | Electromagaz')
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
  const priced = { id: 'synthetic-priced', slug: 'priced', name: 'Pricing test', partNumber: 'PRICED', manufacturer: 'Test',
    category: 'Test', price: 100, priceWholesale: 80, currency: 'RUB', minOrder: 10, unit: 'шт', tags: [], specs: {}, description: '', inStock: false, stockCount: 0 }
  const unknown = { ...priced, id: 'synthetic-unknown', slug: 'unknown', name: 'Unknown test', price: 0, priceWholesale: undefined }
  await page.route('**/api/cart/products', (route) => route.fulfill({ json: { products: [priced, unknown] } }))
  await page.goto('/cart')
  await page.evaluate((product) => {
    localStorage.setItem('electromagaz_cart', JSON.stringify([{ product, quantity: 10 }]))
  }, priced)
  await page.goto('/request-quote')
  await expect(page.getByText(/10 × 80/)).toBeVisible()
  await expect(page.getByText('Предварительная сумма:').locator('..')).toContainText(/800/)
  await page.evaluate((product) => {
    const cart = JSON.parse(localStorage.getItem('electromagaz_cart')!)
    cart.items.push({ productId: product.id, snapshot: product, quantity: 10 })
    localStorage.setItem('electromagaz_cart', JSON.stringify(cart))
  }, unknown)
  await page.reload()
  await expect(page.getByText('Предварительная сумма:').locator('..')).toContainText('По запросу')
  await page.screenshot({path: test.info().outputPath('quote-mixed-prices.png'), fullPage:true})
})

test('catalog cart keeps the canonical product and refreshes changed commercial terms', async ({ page }) => {
  const prisma = database()
  const product = await prisma.product.findFirstOrThrow({ where: { partNumber: 'TPS5430DDAR' } })
  try {
    await page.goto('/catalog?q=TPS5430DDAR')
    const row = page.locator('[data-catalog-product-row]').filter({ hasText: product.partNumber })
    await row.getByRole('button', { name: 'Добавить в корзину' }).click()
    await expect(row.getByRole('button', { name: 'Перейти в корзину' })).toBeVisible()
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('electromagaz_cart')!))
    expect(stored).toMatchObject({ version: 1, items: [{
      productId: product.id,
      quantity: product.minOrder,
      snapshot: { slug: product.slug, priceWholesale: Number(product.priceWholesale) },
    }] })

    await prisma.product.update({
      where: { id: product.id },
      data: { price: 860, priceWholesale: 700, minOrder: 30 },
    })
    await row.getByRole('button', { name: 'Перейти в корзину' }).click()
    await expect(page).toHaveURL(/\/cart$/)
    await expect(page.getByText(/минимальная партия изменилась с 10 на 30/)).toBeVisible()
    await expect(page.getByRole('link', { name: product.name })).toHaveAttribute('href', `/product/${product.slug}`)
    const refreshed = await page.evaluate(() => JSON.parse(localStorage.getItem('electromagaz_cart')!))
    expect(refreshed.items[0]).toMatchObject({ quantity: 30, snapshot: { price: 860, priceWholesale: 700 } })
  } finally {
    await prisma.product.update({
      where: { id: product.id },
      data: { price: product.price, priceWholesale: product.priceWholesale, minOrder: product.minOrder },
    })
    await prisma.$disconnect()
  }
})

test('malformed cart storage does not break the storefront shell', async ({ page }) => {
  await page.goto('/catalog?q=TPS5430DDAR')
  const product = page.locator('[data-catalog-product-row]').filter({ hasText: 'TPS5430DDAR' })
  await expect(product).toBeVisible()
  await page.evaluate(() => localStorage.setItem('electromagaz_cart', 'null'))
  await page.reload()
  await expect(product).toBeVisible()
  await expect(page.getByRole('banner')).toBeVisible()
  await expect(page.getByText('Не удалось загрузить страницу')).toHaveCount(0)
})

test('desktop cart total keeps kopecks from versioned local storage without a catalog refresh', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop sticky navigation shows the cart total')
  const product = {
    id: 'synthetic-kopecks', slug: 'synthetic-kopecks', name: 'Kopecks test', partNumber: 'KOPECKS',
    manufacturer: 'Test', category: 'Test', price: 0.24, currency: 'RUB', minOrder: 1,
    unit: 'шт', tags: [], specs: {}, description: '', inStock: true, stockCount: 1,
  }
  await page.goto('/')
  await page.evaluate((snapshot) => {
    localStorage.setItem('electromagaz_cart', JSON.stringify({
      version: 1,
      items: [{ productId: snapshot.id, quantity: 1, snapshot }],
    }))
  }, product)
  await page.reload()

  const totalLabel = page.locator('a[data-cart-icon="true"] > span').last()
  await expect(totalLabel).toHaveText('0,24 ₽')
  await expect(totalLabel).not.toHaveText('0 ₽')
})

test('manufacturer Enter search keeps kopecks and uses an honest category title', async ({ page }) => {
  const prisma = database()
  const product = await prisma.product.findFirstOrThrow({ where: { partNumber: 'RC0603FR-0710KL' } })
  try {
    await prisma.product.update({ where: { id: product.id }, data: { price: 0.24 } })
    await page.goto('/')
    const search = page.getByPlaceholder('Поиск по артикулу, названию или производителю').first()
    await search.fill('Texas')
    await search.press('Enter')
    await expect(page).toHaveURL(/\/catalog\?q=Texas$/)
    await expect(page.locator('[data-catalog-product-row]').filter({ hasText: 'TPS5430DDAR' })).toBeVisible()

    await page.goto(`/catalog?q=${encodeURIComponent(product.partNumber)}`)
    const row = page.locator('[data-catalog-product-row]').filter({ hasText: product.partNumber })
    await expect(row.locator('[data-product-commerce]')).toContainText('0,24')
    await row.getByText(product.name, { exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Другие товары категории' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Аналоги', exact: true })).toHaveCount(0)
  } finally {
    await prisma.product.update({ where: { id: product.id }, data: { price: product.price } })
    await prisma.$disconnect()
  }
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
    await expect(page).toHaveURL(/page=2/)
    await page.getByRole('link', { name: 'Далее', exact: true }).click()
    await expect(page).toHaveURL(/page=3/)
    const row = page.getByRole('row').filter({hasText: `${marker}-0`})
    await expect(row).toBeVisible()
    await row.getByLabel('Статус оптовой заявки').selectOption('closed')
    await expect.poll(async () => (await prisma.wholesaleLead.findUnique({where:{id:`${marker}-0`}}))?.status).toBe('closed')
  } finally {
    await prisma.wholesaleLead.deleteMany({where:{id:{startsWith:marker}}})
    await prisma.$disconnect()
  }
})
