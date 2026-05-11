/**
 * Parse ChipDip products to CSV
 * 
 * Much faster than direct DB import - parse to CSV first, then bulk import.
 * Can handle millions of products without DB overhead.
 */

import fs from 'fs'
import path from 'path'
import { createHttpClient, DEFAULT_HTTP_CONFIG } from '../src/lib/parser/http-client'
import { createRateLimiter } from '../src/lib/parser/rate-limiter'
import { createBrowserClient } from '../src/lib/parser/browser-client'
import { parseProductPage } from '../src/lib/parser/product-parser'
import { scrapeCatalogPage, extractPaginationInfo } from '../src/lib/parser/catalog-scraper'
import { prisma } from '../src/lib/prisma'

interface CSVRow {
  slug: string
  name: string
  partNumber: string
  sku: string | null
  manufacturer: string
  manufacturerSlug: string
  categorySlug: string
  categoryName: string
  description: string | null
  weight: number | null
  specifications: string // JSON string
  datasheets: string // JSON string
  images: string // JSON string
}

class CSVParser {
  private outputDir = path.join(process.cwd(), 'data', 'parsed')
  private currentFile: string | null = null
  private writeStream: fs.WriteStream | null = null
  private stats = {
    totalProducts: 0,
    imported: 0,
    failed: 0,
    startTime: Date.now(),
  }

  constructor() {
    // Create output directory
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true })
    }
  }

  /**
   * Start new CSV file for category
   */
  private startCategoryFile(categorySlug: string): void {
    if (this.writeStream) {
      this.writeStream.end()
    }

    this.currentFile = path.join(this.outputDir, `${categorySlug}.csv`)
    this.writeStream = fs.createWriteStream(this.currentFile, { flags: 'a' })

    // Write header if file is new
    if (!fs.existsSync(this.currentFile) || fs.statSync(this.currentFile).size === 0) {
      this.writeStream.write('slug,name,partNumber,sku,manufacturer,manufacturerSlug,categorySlug,categoryName,description,weight,specifications,datasheets,images\n')
    }
  }

  /**
   * Escape CSV field
   */
  private escapeCSV(value: string | null | undefined): string {
    if (!value) return ''
    
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    const escaped = value.replace(/"/g, '""')
    if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
      return `"${escaped}"`
    }
    return escaped
  }

  /**
   * Write product to CSV
   */
  private writeProduct(row: CSVRow): void {
    if (!this.writeStream) {
      throw new Error('No write stream open')
    }

    const line = [
      this.escapeCSV(row.slug),
      this.escapeCSV(row.name),
      this.escapeCSV(row.partNumber),
      this.escapeCSV(row.sku),
      this.escapeCSV(row.manufacturer),
      this.escapeCSV(row.manufacturerSlug),
      this.escapeCSV(row.categorySlug),
      this.escapeCSV(row.categoryName),
      this.escapeCSV(row.description),
      row.weight?.toString() || '',
      this.escapeCSV(row.specifications),
      this.escapeCSV(row.datasheets),
      this.escapeCSV(row.images),
    ].join(',')

    this.writeStream.write(line + '\n')
  }

  /**
   * Parse all categories to CSV
   */
  async parseAllCategories(categorySlugs?: string[]): Promise<void> {
    console.log('🚀 Starting CSV parser...')
    console.log(`📁 Output directory: ${this.outputDir}`)

    const rateLimiter = createRateLimiter({ requestsPerSecond: 1 }) // Balanced speed with stability
    
    console.log('🌐 Launching browser...')
    let browserClient = await createBrowserClient()

    try {
      // Get categories to parse
      let categories
      if (categorySlugs && categorySlugs.length > 0) {
        categories = await prisma.category.findMany({
          where: { slug: { in: categorySlugs } },
          select: { id: true, slug: true, name: true },
        })
      } else {
        // Get all Level 2 categories (children of "Электронные компоненты")
        const rootCategory = await prisma.category.findFirst({
          where: { slug: 'category-1730' },
        })

        if (!rootCategory) {
          throw new Error('Root category not found')
        }

        const level1Categories = await prisma.category.findMany({
          where: { parentId: rootCategory.id },
          select: { id: true },
        })

        categories = await prisma.category.findMany({
          where: {
            parentId: { in: level1Categories.map(c => c.id) },
          },
          select: { id: true, slug: true, name: true },
        })
      }

      console.log(`📦 Found ${categories.length} categories to parse`)

      // Parse each category
      for (let i = 0; i < categories.length; i++) {
        const category = categories[i]
        console.log(`\n[${i + 1}/${categories.length}] Processing: ${category.name}`)

        this.startCategoryFile(category.slug)

        try {
          const catalogUrl = `https://www.chipdip.ru/catalog/${category.slug}`
          
          // Get first page to determine total pages
          console.log(`  Fetching catalog page...`)
          const firstPageHtml = await rateLimiter.execute(() =>
            browserClient.fetchPage(catalogUrl)
          )

          const paginationInfo = extractPaginationInfo(firstPageHtml)
          const totalPages = paginationInfo.totalPages || 1
          console.log(`  Found ${totalPages} page(s)`)

          // Parse all pages
          for (let page = 1; page <= totalPages; page++) {
            const pageUrl = page === 1 ? catalogUrl : `${catalogUrl}?page=${page}`
            
            console.log(`  Fetching page ${page}/${totalPages}`)
            const pageHtml = await rateLimiter.execute(() =>
              browserClient.fetchPage(pageUrl)
            )

            const productSlugs = scrapeCatalogPage(pageHtml)
            console.log(`  Found ${productSlugs.length} products on page ${page}`)

            this.stats.totalProducts += productSlugs.length

            // Parse each product
            for (let j = 0; j < productSlugs.length; j++) {
              const slug = productSlugs[j]
              const progress = `[${j + 1}/${productSlugs.length}]`

              try {
                console.log(`    ${progress} Fetching ${slug}...`)
                
                const productUrl = `https://www.chipdip.ru/product/${slug}`
                
                // Retry logic for browser crashes
                let productHtml: string | null = null
                let retries = 0
                const maxRetries = 3
                
                while (!productHtml && retries < maxRetries) {
                  try {
                    productHtml = await rateLimiter.execute(() =>
                      browserClient.fetchPage(productUrl)
                    )
                  } catch (browserError) {
                    retries++
                    const errMsg = browserError instanceof Error ? browserError.message : 'Unknown error'
                    
                    if (errMsg.includes('Target page, context or browser has been closed')) {
                      console.log(`    ${progress} ⚠️  Browser crashed, restarting... (attempt ${retries}/${maxRetries})`)
                      
                      // Close old browser
                      try {
                        await browserClient.close()
                      } catch (e) {
                        // Ignore close errors
                      }
                      
                      // Create new browser
                      browserClient = await createBrowserClient()
                      
                      if (retries < maxRetries) {
                        continue // Retry
                      }
                    }
                    
                    throw browserError // Re-throw if not browser crash or max retries reached
                  }
                }
                
                if (!productHtml) {
                  throw new Error('Failed to fetch page after retries')
                }

                const parseResult = parseProductPage(productHtml, productUrl)

                if (!parseResult.success || !parseResult.data) {
                  const errorMsg = parseResult.success ? 'No data' : parseResult.error
                  console.log(`    ${progress} ⚠️  Failed to parse ${slug}: ${errorMsg}`)
                  this.stats.failed++
                  continue
                }

                const parsedProduct = parseResult.data

                // Create manufacturer slug
                const manufacturerSlug = parsedProduct.manufacturer
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, '-')
                  .replace(/^-|-$/g, '')

                // Write to CSV
                this.writeProduct({
                  slug,
                  name: parsedProduct.name,
                  partNumber: parsedProduct.partNumber,
                  sku: parsedProduct.sku,
                  manufacturer: parsedProduct.manufacturer,
                  manufacturerSlug,
                  categorySlug: category.slug,
                  categoryName: category.name,
                  description: parsedProduct.description,
                  weight: parsedProduct.weight,
                  specifications: JSON.stringify(parsedProduct.specifications || []),
                  datasheets: JSON.stringify(parsedProduct.datasheets || []),
                  images: JSON.stringify(parsedProduct.images || []),
                })

                this.stats.imported++
                console.log(`    ${progress} ✅ ${parsedProduct.name}`)

                // Show stats every 10 products
                if (this.stats.imported % 10 === 0) {
                  this.showStats()
                }

              } catch (error) {
                this.stats.failed++
                const errorMessage = error instanceof Error ? error.message : 'Unknown error'
                console.log(`    ${progress} ❌ Failed ${slug}: ${errorMessage}`)
              }
            }
          }

          console.log(`  ✅ Category completed: ${category.name}`)

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          console.log(`  ❌ Failed to process category ${category.name}: ${errorMessage}`)
        }
      }

      // Final stats
      console.log('\n' + '='.repeat(60))
      console.log('🎉 Parsing completed!')
      this.showStats()
      console.log('='.repeat(60))

    } finally {
      if (this.writeStream) {
        this.writeStream.end()
      }
      await browserClient.close()
    }
  }

  /**
   * Show current stats
   */
  private showStats(): void {
    const duration = Math.floor((Date.now() - this.stats.startTime) / 1000)
    const speed = duration > 0 ? (this.stats.imported / duration * 60).toFixed(1) : '0'
    
    console.log(`\n📊 Stats: Total=${this.stats.totalProducts}, Imported=${this.stats.imported}, Failed=${this.stats.failed}, Speed=${speed}/min, Duration=${Math.floor(duration / 60)}m ${duration % 60}s`)
  }
}

// Run parser
async function main() {
  const parser = new CSVParser()

  // Parse specific categories or all
  const categorySlugs = process.argv.slice(2)
  
  if (categorySlugs.length > 0) {
    console.log(`Parsing specific categories: ${categorySlugs.join(', ')}`)
    await parser.parseAllCategories(categorySlugs)
  } else {
    console.log('Parsing all categories...')
    await parser.parseAllCategories()
  }

  await prisma.$disconnect()
}

main().catch(console.error)
