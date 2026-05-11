import { createBrowserClient } from '../src/lib/parser/browser-client'

async function extractPager() {
  const browserClient = await createBrowserClient()
  const html = await browserClient.fetchPage('https://www.chipdip.ru/catalog/mikrokontrollery-1738')
  
  // Find pager HTML
  const pagerStart = html.indexOf('<div class="pager')
  const pagerEnd = html.indexOf('</div>', pagerStart + 500)
  
  if (pagerStart !== -1) {
    const pagerHTML = html.substring(pagerStart, pagerEnd + 6)
    console.log('Pager HTML:')
    console.log(pagerHTML)
    console.log('\n---\n')
    
    // Extract all links from pager
    const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g
    let match
    const links = []
    while ((match = linkRegex.exec(pagerHTML)) !== null) {
      links.push({ href: match[1], text: match[2] })
    }
    
    console.log('Pager links found:', links.length)
    links.forEach(link => console.log(`  - "${link.text}" -> ${link.href}`))
  } else {
    console.log('Pager not found')
  }
  
  await browserClient.close()
}

extractPager()
