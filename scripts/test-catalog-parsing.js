const { chromium } = require('playwright')

async function testCatalogParsing() {
  console.log('🔍 Testing ChipDip catalog parsing...\n')
  
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  
  try {
    console.log('📥 Navigating to catalog...')
    await page.goto('https://www.chipdip.ru/catalog/mikrokontrollery', {
      waitUntil: 'networkidle',
      timeout: 30000
    })
    
    console.log('⏳ Waiting 5 seconds for AJAX...')
    await page.waitForTimeout(5000)
    
    const html = await page.content()
    console.log(`📄 HTML length: ${html.length} bytes\n`)
    
    // Try different selectors
    console.log('🔎 Checking selectors:')
    
    const selectors = [
      'a[href*="/product/"]',
      '.catalog__item a',
      '.product_simple a',
      'a.product__name',
      '[data-product]',
      '.item a',
      '.card a'
    ]
    
    for (const selector of selectors) {
      const elements = await page.$$(selector)
      console.log(`  ${selector}: ${elements.length} elements`)
      
      if (elements.length > 0 && elements.length < 10) {
        for (let i = 0; i < Math.min(3, elements.length); i++) {
          const href = await elements[i].getAttribute('href')
          const text = await elements[i].textContent()
          console.log(`    [${i+1}] ${href} - ${text?.substring(0, 50)}`)
        }
      }
    }
    
    // Check for pagination
    console.log('\n📄 Checking pagination:')
    const pagination = await page.$('.pagination')
    console.log(`  Pagination element: ${pagination ? 'YES' : 'NO'}`)
    
    // Check for load more button
    const loadMoreSelectors = [
      'button:has-text("Показать")',
      'button:has-text("Загрузить")',
      '.load-more',
      '[data-load-more]'
    ]
    
    for (const selector of loadMoreSelectors) {
      try {
        const btn = await page.$(selector)
        if (btn) {
          const text = await btn.textContent()
          console.log(`  Load more button: ${selector} - "${text}"`)
        }
      } catch (e) {
        // Ignore
      }
    }
    
    // Save HTML for inspection
    const fs = require('fs')
    fs.writeFileSync('/tmp/chipdip_test.html', html)
    console.log('\n💾 HTML saved to /tmp/chipdip_test.html')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await browser.close()
  }
}

testCatalogParsing()
