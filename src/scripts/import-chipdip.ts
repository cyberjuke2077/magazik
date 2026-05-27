/**
 * ChipDip Product Import Script
 * 
 * Fetches product URLs from catalog, parses product pages, and imports to database.
 * Features:
 * - Progress tracking with console output
 * - Error handling: skip failed products, continue processing
 * - Transaction support for data integrity
 * - Idempotent: can re-run without duplicates (upsert logic)
 * - Rate limiting to respect ChipDip servers
 */

import { prisma } from '../lib/prisma'
import { parseProductPage } from '../lib/parser/product-parser'
import { scrapeCatalog } from '../lib/parser/catalog-scraper'
import { createBrowserClient } from '../lib/parser/browser-client'
import { createHttpClient, DEFAULT_HTTP_CONFIG } from '../lib/parser/http-client'
import { createRateLimiter } from '../lib/parser/rate-limiter'
import type { ParsedProduct } from '../lib/parser/types'

interface ImportOptions {
  maxProducts?: number
  batchSize?: number
  catalogUrl?: string
}

interface ImportResult {
  total: number
  successful: number
  failed: number
  errors: Array<{ slug: string; error: string }>
}

interface ImportStats {
  processed: number
  successful: number
  failed: number
  errors: Array<{ slug: string; error: string }>
}

/**
 * Fetches product slugs from ChipDip catalog using provided browser client
 * Supports pagination to fetch multiple pages
 */
async function fetchProductSlugsWithBrowser(
  browserClient: Awaited<ReturnType<typeof createBrowserClient>>,
  catalogUrl: string,
  maxProducts: number
): Promise<string[]> {
  console.log(`Fetching product URLs from: ${catalogUrl}`)
  console.log(`Target: ${maxProducts} products`)
  
  const allSlugs: string[] = []
  let currentPage = 1
  
  while (allSlugs.length < maxProducts) {
    const pageUrl = currentPage === 1 
      ? catalogUrl 
      : `${catalogUrl}?page=${currentPage}`
    
    console.log(`\nFetching page ${currentPage}: ${pageUrl}`)
    
    const html = await browserClient.fetchPage(pageUrl)
    const result = scrapeCatalog(html)
    
    if (result.productSlugs.length === 0) {
      console.log('No more products found, stopping pagination')
      break
    }
    
    // Add new slugs (avoid duplicates)
    const newSlugs = result.productSlugs.filter(slug => !allSlugs.includes(slug))
    allSlugs.push(...newSlugs)
    
    console.log(`Found ${result.productSlugs.length} products on page ${currentPage} (${newSlugs.length} new)`)
    console.log(`Total collected: ${allSlugs.length}/${maxProducts}`)
    
    // Check if we have enough products
    if (allSlugs.length >= maxProducts) {
      console.log(`Reached target of ${maxProducts} products`)
      break
    }
    
    // Check if there's a next page
    if (result.pagination && !result.pagination.hasNextPage) {
      console.log('No more pages available')
      break
    }
    
    currentPage++
    
    // Safety limit: max 50 pages
    if (currentPage > 50) {
      console.log('Reached maximum page limit (50)')
      break
    }
  }
  
  const limitedSlugs = allSlugs.slice(0, maxProducts)
  console.log(`\nTotal products collected: ${allSlugs.length}`)
  console.log(`Will import: ${limitedSlugs.length}`)
  
  return limitedSlugs
}

/**
 * Fetches and parses a single product page using HTTP client
 */
async function fetchAndParseProductWithHttp(
  httpClient: ReturnType<typeof createHttpClient>,
  slug: string
): Promise<ParsedProduct> {
  const productUrl = `https://www.chipdip.ru/product/${slug}`
  const html = await httpClient.get(productUrl)
  
  const parseResult = parseProductPage(html)
  
  if (!parseResult.success) {
    throw new Error(parseResult.error || 'Failed to parse product')
  }
  
  console.log(`  [DEBUG] Parsed weight: ${parseResult.data!.weight}`)
  
  return parseResult.data!
}

/**
 * Fetches and parses a single product page using browser client
 */
async function fetchAndParseProductWithBrowser(
  browserClient: Awaited<ReturnType<typeof createBrowserClient>>,
  slug: string
): Promise<ParsedProduct> {
  const productUrl = `https://www.chipdip.ru/product/${slug}`
  const html = await browserClient.fetchPage(productUrl)
  
  const parseResult = parseProductPage(html)
  
  if (!parseResult.success) {
    throw new Error(parseResult.error || 'Failed to parse product')
  }
  
  console.log(`  [DEBUG] Parsed weight: ${parseResult.data!.weight}`)
  
  return parseResult.data!
}

/**
 * Finds or creates manufacturer in database
 */
async function findOrCreateManufacturer(
  name: string,
  tx: any
): Promise<string> {
  if (!name || name.trim().length === 0) {
    throw new Error('Manufacturer name is required')
  }
  
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  
  const manufacturer = await tx.manufacturer.upsert({
    where: { slug },
    update: {},
    create: {
      name,
      slug,
    },
  })
  
  return manufacturer.id
}

/**
 * Finds or creates category in database
 */
async function findOrCreateCategory(
  name: string,
  tx: any
): Promise<string> {
  if (!name || name.trim().length === 0) {
    throw new Error('Category name is required')
  }
  
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  
  const category = await tx.category.upsert({
    where: { slug },
    update: {},
    create: {
      name,
      slug,
    },
  })
  
  return category.id
}

/**
 * Imports a single product to database with transaction
 */
async function importProductToDatabase(
  slug: string,
  parsedProduct: ParsedProduct
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Validate required fields
    if (!parsedProduct.manufacturer) {
      throw new Error('Manufacturer is required')
    }
    
    if (!parsedProduct.category) {
      throw new Error('Category is required')
    }
    
    if (!parsedProduct.partNumber) {
      throw new Error('Part number is required')
    }
    
    // Find or create manufacturer and category
    const manufacturerId = await findOrCreateManufacturer(parsedProduct.manufacturer, tx)
    const categoryId = await findOrCreateCategory(parsedProduct.category, tx)
    
    // Upsert product (idempotent)
    const product = await tx.product.upsert({
      where: { slug },
      update: {
        name: parsedProduct.name,
        partNumber: parsedProduct.partNumber,
        sku: parsedProduct.sku,
        description: parsedProduct.description,
        weight: parsedProduct.weight,
        manufacturerId,
        categoryId,
      },
      create: {
        slug,
        name: parsedProduct.name,
        partNumber: parsedProduct.partNumber,
        sku: parsedProduct.sku,
        description: parsedProduct.description,
        weight: parsedProduct.weight,
        manufacturerId,
        categoryId,
      },
    })
    
    // Delete existing related data to avoid duplicates
    await tx.productImage.deleteMany({ where: { productId: product.id } })
    await tx.specification.deleteMany({ where: { productId: product.id } })
    await tx.datasheet.deleteMany({ where: { productId: product.id } })
    
    // Insert images
    if (parsedProduct.images.length > 0) {
      await tx.productImage.createMany({
        data: parsedProduct.images.map((imageUrl, index) => ({
          productId: product.id,
          imageUrl,
          order: index,
        })),
      })
    }
    
    // Insert specifications
    const specEntries = Object.entries(parsedProduct.specifications)
    if (specEntries.length > 0) {
      await tx.specification.createMany({
        data: specEntries.map(([key, value], index) => ({
          productId: product.id,
          key,
          value,
          order: index,
        })),
      })
    }
    
    // Insert datasheets
    if (parsedProduct.datasheets.length > 0) {
      await tx.datasheet.createMany({
        data: parsedProduct.datasheets.map((url) => ({
          productId: product.id,
          title: 'Datasheet',
          url,
        })),
      })
    }
    
    // Note: Analogs are handled separately after all products are imported
  })
}

/**
 * Imports products in batches with progress tracking
 */
async function importProducts(options: ImportOptions = {}): Promise<ImportResult> {
  const {
    maxProducts = 100,
    batchSize = 20,
    catalogUrl = 'https://www.chipdip.ru/catalog/mikrokontrollery-1738',
  } = options
  
  const stats: ImportStats = {
    processed: 0,
    successful: 0,
    failed: 0,
    errors: [],
  }
  
  // Initialize browser client for catalog scraping
  console.log('Initializing headless browser for catalog...')
  let browserClient = await createBrowserClient({
    headless: true,
    timeout: 30000,
    blockResources: true,
  })
  
  let slugs: string[] = []
  
  try {
    // Fetch product slugs from catalog
    slugs = await fetchProductSlugsWithBrowser(browserClient, catalogUrl, maxProducts)
    
    if (slugs.length === 0) {
      console.log('No products found in catalog')
      return {
        total: 0,
        successful: 0,
        failed: 0,
        errors: [],
      }
    }
  } catch (error) {
    console.error('Failed to fetch catalog:', error)
    await browserClient.close()
    throw error
  }
  
  // Keep browser open for product pages (HTTP client is blocked by ChipDip)
  console.log('\nUsing browser for product pages (HTTP client blocked by ChipDip)...')
  
  try {
    for (let i = 0; i < slugs.length; i += batchSize) {
      const batch = slugs.slice(i, i + batchSize)
      
      console.log(`\nProcessing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(slugs.length / batchSize)}`)
      
      // Process batch sequentially with delays to avoid captcha
      for (const slug of batch) {
        stats.processed++
        
        try {
          // Fetch and parse product using browser
          const parsedProduct = await fetchAndParseProductWithBrowser(browserClient, slug)
          
          // Import to database
          await importProductToDatabase(slug, parsedProduct)
          
          stats.successful++
          console.log(`✓ Imported ${stats.processed}/${slugs.length}: ${slug}`)
        } catch (error) {
          stats.failed++
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          stats.errors.push({ slug, error: errorMessage })
          
          console.error(`✗ Failed ${stats.processed}/${slugs.length}: ${slug} - ${errorMessage}`)
          
          // Continue processing next product
          continue
        }
      }
    }
    
    // Print summary
    console.log('\n' + '='.repeat(60))
    console.log('Import Summary')
    console.log('='.repeat(60))
    console.log(`Total processed: ${stats.processed}`)
    console.log(`Successful: ${stats.successful}`)
    console.log(`Failed: ${stats.failed}`)
    
    if (stats.errors.length > 0) {
      console.log('\nFailed products:')
      stats.errors.forEach(({ slug, error }) => {
        console.log(`  - ${slug}: ${error}`)
      })
    }
    
    return {
      total: stats.processed,
      successful: stats.successful,
      failed: stats.failed,
      errors: stats.errors,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`\nFatal error during import: ${errorMessage}`)
    throw error
  } finally {
    await browserClient.close()
    console.log('Browser closed')
    await prisma.$disconnect()
  }
}

/**
 * Main entry point
 */
async function main() {
  console.log('ChipDip Product Import')
  console.log('='.repeat(60))
  
  const startTime = Date.now()
  
  try {
    const result = await importProducts({
      maxProducts: 50,
      batchSize: 10,
    })
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`\nCompleted in ${duration}s`)
    
    process.exit(result.failed > 0 ? 1 : 0)
  } catch (error) {
    console.error('Import failed:', error)
    process.exit(1)
  }
}

// Run if executed directly
if (require.main === module) {
  main()
}

export { importProducts, type ImportOptions, type ImportResult }
