import { expect, test, type Page } from '@playwright/test'

const publicRoutes = [
  '/',
  '/catalog',
  '/cart',
  '/compare',
  '/request-quote',
  '/wholesale',
] as const

const storageFixtures = {
  electromagaz_cart: '[]',
  'electromagaz:compare': '[]',
  'electromagaz:recently-viewed': '[]',
  electromagaz_search_history: '["STM32"]',
} as const

async function openStable(page: Page, path: string) {
  const response = await page.goto(path, { waitUntil: 'domcontentloaded' })
  expect(response?.status(), `${path} returned an unexpected response`).toBeLessThan(500)
  await page.waitForLoadState('networkidle')
}

async function seedStorefrontStorage(page: Page) {
  await page.addInitScript((fixtures) => {
    for (const [key, value] of Object.entries(fixtures)) {
      window.localStorage.setItem(key, value)
    }
  }, storageFixtures)
}

async function expectVisualReady(page: Page, route: '/' | '/catalog' | '/cart' | '/compare') {
  if (route === '/') {
    await expect(page.getByRole('heading', { name: 'Новые товары', exact: true })).toBeVisible()
    return
  }

  if (route === '/catalog') {
    await expect(page.getByRole('heading', { name: 'Каталог', exact: true })).toBeVisible()
    return
  }

  if (route === '/cart') {
    await expect(page.getByRole('heading', { name: 'Пока пусто', exact: true })).toBeVisible()
    return
  }

  await expect(page.getByRole('heading', { name: 'Список сравнения пуст', exact: true })).toBeVisible()
}

test.describe('public storefront contracts', () => {
  test('keyboard skip link moves focus to the main content', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')
    const skipLink = page.getByRole('link', { name: 'К основному содержанию' })
    await expect(skipLink).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('#main-content')).toBeFocused()
  })

  test('404 and empty catalog states are understandable', async ({ page }) => {
    const response = await page.goto('/route-that-does-not-exist')
    expect(response?.status()).toBe(404)
    await expect(page.getByRole('heading', { name: 'Страница не найдена' })).toBeVisible()

    await page.goto('/catalog?q=MPN-THAT-DOES-NOT-EXIST')
    await expect(page.getByRole('heading', { name: 'Ничего не найдено' })).toBeVisible()
  })

  for (const route of publicRoutes) {
    test(`${route} renders without a server error`, async ({ page }) => {
      const browserErrors: string[] = []
      page.on('pageerror', (error) => browserErrors.push(error.name))
      page.on('console', (message) => {
        if (message.type() === 'error') browserErrors.push(message.text())
      })

      await openStable(page, route)
      await expect(page.locator('body')).toBeVisible()
      expect(browserErrors, `${route} emitted browser errors`).toEqual([])
    })
  }

  test('catalog keeps supported URL parameters', async ({ page }) => {
    const params = new URLSearchParams({
      q: 'STM32',
      category: 'mikrokontrollery',
      manufacturer: 'STMicroelectronics',
      sort: 'name',
      view: 'table',
      limit: '25',
      page: '1',
    })

    await openStable(page, `/catalog?${params}`)

    for (const [key, value] of params) {
      expect(new URL(page.url()).searchParams.get(key)).toBe(value)
    }
  })

  test('localStorage keys survive storefront navigation', async ({ page }) => {
    await seedStorefrontStorage(page)

    await openStable(page, '/')
    await openStable(page, '/catalog')

    const stored = await page.evaluate((keys) => {
      return Object.fromEntries(keys.map((key) => [key, window.localStorage.getItem(key)]))
    }, Object.keys(storageFixtures))

    expect(stored).toEqual(storageFixtures)
  })

  test('cart and product hooks remain available', async ({ page }) => {
    await openStable(page, '/catalog?category=pitanie')
    await expect(page.locator('[data-cart-icon]').first()).toBeAttached()

    const firstProduct = page.locator('a[href^="/product/"]').first()
    await expect(firstProduct).toBeVisible()
    await firstProduct.click()
    await page.waitForLoadState('networkidle')

    await expect(page.locator('[data-add-to-cart-block]')).toBeAttached()
  })
})

test.describe('visual baseline', () => {
  for (const route of ['/', '/catalog', '/cart', '/compare'] as const) {
    test(`${route} full page`, async ({ page }) => {
      await seedStorefrontStorage(page)
      await openStable(page, route)
      await expectVisualReady(page, route)
      await expect(page).toHaveScreenshot(`${route === '/' ? 'home' : route.slice(1)}-full.png`, {
        fullPage: true,
      })
    })
  }
})
