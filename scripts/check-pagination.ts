import { createBrowserClient } from '../src/lib/parser/browser-client'

async function checkPagination() {
  const browserClient = await createBrowserClient()
  const html = await browserClient.fetchPage('https://www.chipdip.ru/catalog/mikrokontrollery-1738')
  
  // Check for pagination-related classes
  const paginationPatterns = [
    'pagination',
    'pager',
    'page-nav',
    'catalog__pagination',
    'next-page',
    'следующая',
  ]
  
  console.log('HTML length:', html.length)
  console.log('\nSearching for pagination patterns:')
  
  for (const pattern of paginationPatterns) {
    const regex = new RegExp(pattern, 'gi')
    const matches = html.match(regex)
    if (matches) {
      console.log(`✅ Found "${pattern}": ${matches.length} occurrences`)
      
      // Extract surrounding HTML
      const index = html.toLowerCase().indexOf(pattern.toLowerCase())
      if (index !== -1) {
        const snippet = html.substring(Math.max(0, index - 200), Math.min(html.length, index + 500))
        console.log('Context:', snippet.substring(0, 300))
      }
    } else {
      console.log(`❌ Not found: "${pattern}"`)
    }
  }
  
  await browserClient.close()
}

checkPagination()
