import { chromium } from 'rebrowser-playwright'
import * as cheerio from 'cheerio'

async function test() {
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()
  
  const url = 'https://www.chipdip.ru/product/drayver-cd4543bm-tr-hgsemi-8055726723'
  console.log('Opening:', url)
  
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(5000)
  
  const html = await page.content()
  const $ = cheerio.load(html)
  
  console.log('\n=== Checking selectors ===')
  console.log('h1:', $('h1').text().trim())
  console.log('.product__title:', $('.product__title').text().trim())
  console.log('.product__article:', $('.product__article').text().trim())
  console.log('.product__params:', $('.product__params').length)
  console.log('.product__params tr:', $('.product__params tr').length)
  
  console.log('\n=== First 3 params ===')
  $('.product__params tr').slice(0, 3).each((i, row) => {
    const name = $(row).find('td').eq(0).text().trim()
    const value = $(row).find('td').eq(1).text().trim()
    console.log(`${i + 1}. ${name}: ${value}`)
  })
  
  await browser.close()
}

test().catch(console.error)
