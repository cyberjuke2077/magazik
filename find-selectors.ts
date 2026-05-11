import { chromium } from 'rebrowser-playwright'
import * as cheerio from 'cheerio'

async function test() {
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()
  
  await page.goto('https://www.chipdip.ru/product/drayver-cd4543bm-tr-hgsemi-8055726723', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(5000)
  
  const html = await page.content()
  const $ = cheerio.load(html)
  
  console.log('=== Searching for manufacturer ===')
  $('*').each((i, el) => {
    const text = $(el).text().trim()
    if (text.includes('HGSemi') || text.includes('Производитель')) {
      const tag = el.tagName
      const classes = $(el).attr('class') || ''
      const id = $(el).attr('id') || ''
      console.log(`${tag}.${classes}#${id}: ${text.substring(0, 100)}`)
    }
  })
  
  console.log('\n=== Searching for part number (CD4543BM/TR) ===')
  $('*').each((i, el) => {
    const text = $(el).text().trim()
    if (text.includes('CD4543BM') || text.includes('Артикул')) {
      const tag = el.tagName
      const classes = $(el).attr('class') || ''
      console.log(`${tag}.${classes}: ${text.substring(0, 80)}`)
    }
  })
  
  await browser.close()
}

test().catch(console.error)
