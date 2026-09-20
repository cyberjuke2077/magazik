import { expect, test } from '@playwright/test'

test('product image opens its detail page', async ({ page }) => {
  await page.goto('/')
  const imageLink = page.locator('[data-product-image-link]').first()
  const href = await imageLink.getAttribute('href')
  await imageLink.click()
  await expect(page).toHaveURL(new RegExp(`${href}$`))
})

test('all featured categories remain reachable on mobile', async ({ page }) => {
  await page.goto('/')
  const categories = page.getByRole('region', { name: 'Что ищете?' })
  await expect(categories.getByRole('link', { name: /Питание и управление питанием/ })).toBeVisible()
  await categories.getByRole('link', { name: /Питание и управление питанием/ }).click()
  await expect(page).toHaveURL(/category=pitanie/)
})

test('city dialog closes with Escape and returns keyboard focus', async ({ page }) => {
  await page.goto('/')
  const trigger = page.getByRole('button', { name: 'Москва', exact: true })
  await trigger.click()
  await expect(page.getByRole('dialog', { name: 'Ваш город' })).toBeVisible()
  await page.getByRole('textbox', { name: 'Поиск города' }).fill('Казань')
  await expect(page.getByRole('button', { name: /Казань Республика Татарстан/ })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(trigger).toBeFocused()
})

test('mobile comparison panel leaves bottom navigation clickable', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Mobile navigation contract')
  await page.goto('/catalog')
  await page.getByTitle('Добавить в сравнение').first().click()
  await expect(page.getByRole('link', { name: 'Открыть сравнение' })).toBeVisible()
  const nav = page.getByRole('navigation', { name: 'Основная навигация' })
  const navBox = await nav.boundingBox()
  expect(navBox!.y).toBeGreaterThan(page.viewportSize()!.height - 100)
  await page.getByRole('navigation', { name: 'Основная навигация' }).getByRole('link', { name: 'Корзина' }).click()
  await expect(page).toHaveURL(/\/cart$/)
})

for (const width of [320, 768, 1024]) {
  test(`storefront and catalog fit ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    for (const route of ['/', '/catalog']) {
      await page.goto(route)
      await page.waitForLoadState('networkidle')
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      if (route === '/catalog') {
        const row = page.locator('[data-catalog-product-row]').first()
        expect(await row.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1)
      }
    }
  })
}

test('wholesale server markup disables editing until the draft is restored', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL })
  try {
    const page = await context.newPage()
    await page.goto('/wholesale#request-form')
    await expect(page.getByLabel('Имя *', { exact: true })).toBeDisabled()
    // Streamed markup remains hidden until Next.js reveals its Suspense boundary.
    await expect(page.getByRole('button', { name: 'Отправить заявку', includeHidden: true })).toBeDisabled()
  } finally {
    await context.close()
  }
})
