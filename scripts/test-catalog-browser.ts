/**
 * Test Catalog Parsing with Browser
 * 
 * Tests what HTML the browser returns for a catalog page
 */

import { createBrowserClient } from '../src/lib/parser/browser-client'
import { scrapeCatalogPage } from '../src/lib/parser/catalog-scraper'
import * as fs from 'fs'

const CATALOG_URL = 'https://www.chipdip.ru/catalog/mikrokontrollery-1738'

async function testCatalogBrowser() {
  console.log('Testing catalog parsing with browser...')
  console.log(`URL: ${CATALOG_URL}\n`)

  console.log('Creating browser client...')
  const browserClient = await createBrowserClient()

  try {

    console.log('Fetching catalog page...')
    const html = await browserClient.fetchPage(CATALOG_URL)

    console.log(`HTML length: ${html.length} bytes`)

    // Save HTML to file for inspection
    const filename = '/tmp/catalog-page.html'
    fs.writeFileSync(filename, html)
    console.log(`HTML saved to: ${filename}`)

    // Try to parse product links
    const productSlugs = scrapeCatalogPage(html)
    console.log(`\nFound ${productSlugs.length} product slugs`)

    if (productSlugs.length > 0) {
      console.log('\nFirst 10 products:')
      productSlugs.slice(0, 10).forEach((slug, i) => {
        console.log(`  ${i + 1}. ${slug}`)
      })
    } else {
      console.log('\n❌ No products found!')
      
      // Debug: check what links are in the HTML
      const linkMatches = html.match(/<a[^>]*href="[^"]*"[^>]*>/g) || []
      console.log(`\nTotal <a> tags found: ${linkMatches.length}`)
      
      // Check for product links
      const productLinkMatches = html.match(/href="[^"]*\/product\/[^"]*"/g) || []
      console.log(`Links with /product/: ${productLinkMatches.length}`)
      
      if (productLinkMatches.length > 0) {
        console.log('\nFirst 5 product links:')
        productLinkMatches.slice(0, 5).forEach(link => console.log(`  ${link}`))
      }

      // Check for catalog items
      const catalogItems = html.match(/class="[^"]*catalog[^"]*"/g) || []
      console.log(`\nElements with "catalog" class: ${catalogItems.length}`)
      
      // Check for common product container classes
      const productContainers = html.match(/class="[^"]*(product|item|card)[^"]*"/g) || []
      console.log(`Elements with product/item/card class: ${productContainers.length}`)
    }

    await browserClient.close()
    console.log('\n✅ Test completed')

  } catch (error) {
    console.error('\n❌ Test failed:', error)
    await browserClient.close()
    process.exit(1)
  }
}

testCatalogBrowser()
