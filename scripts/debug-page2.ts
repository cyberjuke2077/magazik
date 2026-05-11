import { createBrowserClient } from '../src/lib/parser/browser-client'

async function debugPage2() {
  const browserClient = await createBrowserClient()
  
  console.log('Fetching page 1...')
  const html1 = await browserClient.fetchPage('https://www.chipdip.ru/catalog/mikrokontrollery-1738')
  const products1 = (html1.match(/href="[^"]*\/product\/[^"]*"/g) || []).length
  console.log(`Page 1: ${products1} product links found`)
  
  console.log('\nFetching page 2...')
  const html2 = await browserClient.fetchPage('https://www.chipdip.ru/catalog/mikrokontrollery-1738?page=2')
  const products2 = (html2.match(/href="[^"]*\/product\/[^"]*"/g) || []).length
  console.log(`Page 2: ${products2} product links found`)
  
  // Check for captcha or error
  if (html2.includes('captcha') || html2.includes('Все нормально, я не робот')) {
    console.log('⚠️  CAPTCHA detected on page 2!')
  }
  
  if (html2.includes('Страница не найдена') || html2.includes('404')) {
    console.log('⚠️  404 error on page 2!')
  }
  
  console.log(`\nPage 2 HTML length: ${html2.length}`)
  console.log(`Page 1 HTML length: ${html1.length}`)
  
  await browserClient.close()
}

debugPage2()
