/**
 * Test script to debug Playwright catalog scraping
 */

import { createBrowserClient } from '../src/lib/parser/browser-client'
import { scrapeCatalogPage } from '../src/lib/parser/catalog-scraper'
import { writeFileSync } from 'fs'

async function testPlaywright() {
  const catalogUrl = 'https://www.chipdip.ru/catalog/mikroshemy-1731'
  
  console.log('Creating browser client...')
  const browserClient = await createBrowserClient({
    headless: true,
    timeout: 30000,
    blockResources: true,
  })
  
  try {
    console.log(`Fetching: ${catalogUrl}`)
    const html = await browserClient.fetchPage(catalogUrl)
    
    console.log(`HTML length: ${html.length} characters`)
    
    // Save HTML to file for inspection
    writeFileSync('/tmp/chipdip-catalog.html', html, 'utf-8')
    console.log('Saved HTML to /tmp/chipdip-catalog.html')
    
    // Try to parse
    const slugs = scrapeCatalogPage(html)
    console.log(`Found ${slugs.length} product slugs`)
    
    if (slugs.length > 0) {
      console.log('First 10 slugs:', slugs.slice(0, 10))
    } else {
      console.log('No slugs found. Checking for product links in HTML...')
      
      // Check if there are any links with /product/ in them
      const productLinkMatches = html.match(/href="[^"]*\/product\/[^"]*"/g)
      if (productLinkMatches) {
        console.log(`Found ${productLinkMatches.length} product link matches in HTML`)
        console.log('First 5 matches:', productLinkMatches.slice(0, 5))
      } else {
        console.log('No /product/ links found in HTML at all')
      }
    }
  } finally {
    await browserClient.close()
  }
}

testPlaywright().catch(console.error)
