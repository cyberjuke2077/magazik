/**
 * fetch-chipdip-fixture.ts
 *
 * Скачивает живую HTML-страницу товара chipdip.ru через CloakBrowser
 * и сохраняет её как фикстуру для unit-тестов парсера.
 *
 * Usage:
 *   pnpm tsx scripts/fetch-chipdip-fixture.ts --mpn STM32F103C8T6 --out src/lib/parser/__fixtures__/chipdip/stm32f103c8t6.html
 *
 * Логика:
 *   1. Заходит на https://www.chipdip.ru/search?searchtext=<MPN>
 *   2. Берёт первую ссылку a[href*="/product/"], переходит на неё
 *   3. Дожидается networkidle, сохраняет page.content() в --out файл
 *   4. Регистрирует Browser в browser-registry, чтобы при Ctrl+C
 *      хромиум не висел orphan-процессом
 *
 * Не использует прокси и stealth-fallback от chipdip-client — это утилита для
 * локального обновления фикстур, не production-код. При CloudFlare-challenge
 * запустить ещё раз через минуту.
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import * as cheerio from 'cheerio'

import {
  registerBrowser,
  unregisterBrowser,
  closeAllBrowsers,
  installExitHandlers,
} from '../src/lib/enrichment/browser-registry'

interface CliArgs {
  mpn: string
  out: string
}

function parseArgs(argv: string[]): CliArgs {
  const args: Partial<CliArgs> = {}
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i]
    const value = argv[i + 1]
    if (key === '--mpn' && value) {
      args.mpn = value
      i++
    } else if (key === '--out' && value) {
      args.out = value
      i++
    }
  }
  if (!args.mpn || !args.out) {
    throw new Error('Usage: fetch-chipdip-fixture.ts --mpn <MPN> --out <path>')
  }
  return { mpn: args.mpn, out: args.out }
}

async function main(): Promise<void> {
  installExitHandlers()
  const { mpn, out } = parseArgs(process.argv.slice(2))
  const outPath = resolve(process.cwd(), out)
  mkdirSync(dirname(outPath), { recursive: true })

  const { launch } = await import('cloakbrowser')
  const browser = await launch({
    headless: true,
    locale: 'ru-RU',
    timezone: 'Europe/Moscow',
  })
  registerBrowser(browser)

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await context.newPage()

    const searchUrl = `https://www.chipdip.ru/search?searchtext=${encodeURIComponent(mpn)}`
    console.log(`[fetch] search: ${searchUrl}`)
    const searchResponse = await page.goto(searchUrl, {
      waitUntil: 'networkidle',
      timeout: 60_000,
    })
    if (!searchResponse) {
      throw new Error(`No response from search for ${mpn}`)
    }
    const searchStatus = searchResponse.status()
    if (searchStatus !== 200) {
      throw new Error(`Search returned HTTP ${searchStatus} for ${mpn}`)
    }

    const searchHtml = await page.content()
    const $ = cheerio.load(searchHtml)
    const firstHref = $('a[href*="/product/"]').first().attr('href')
    if (!firstHref) {
      throw new Error(`No product link found in search results for ${mpn}`)
    }

    const productUrl = firstHref.startsWith('http')
      ? firstHref
      : `https://www.chipdip.ru${firstHref}`
    console.log(`[fetch] product: ${productUrl}`)

    const productResponse = await page.goto(productUrl, {
      waitUntil: 'networkidle',
      timeout: 60_000,
    })
    if (!productResponse) {
      throw new Error(`No response from product page for ${mpn}`)
    }
    const productStatus = productResponse.status()
    if (productStatus !== 200) {
      throw new Error(`Product page returned HTTP ${productStatus} for ${mpn}`)
    }

    const html = await page.content()
    writeFileSync(outPath, html, 'utf-8')
    const sizeKb = (html.length / 1024).toFixed(1)
    console.log(`[fetch] saved ${outPath} (${sizeKb} KB)`)
  } finally {
    try {
      await browser.close()
    } catch {
      // ignore
    }
    unregisterBrowser(browser)
    await closeAllBrowsers(2000)
  }
}

main().catch(err => {
  console.error('[fetch] failed:', err)
  void closeAllBrowsers(2000).finally(() => process.exit(1))
})
