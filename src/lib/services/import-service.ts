/**
 * Import Service
 * 
 * Manages background product import from ChipDip.
 * Provides real-time status, logs, and statistics.
 * Supports importing all categories with progress tracking and resume capability.
 */

import { prisma } from '../prisma'
import { createHttpClient, DEFAULT_HTTP_CONFIG } from '../parser/http-client'
import { createRateLimiter } from '../parser/rate-limiter'
import { createBrowserClient } from '../parser/browser-client'
import { parseProductPage } from '../parser/product-parser'
import { scrapeCatalogPage, extractPaginationInfo } from '../parser/catalog-scraper'
import type { ParsedProduct } from '../parser/types'

export interface ImportLog {
  id: number
  timestamp: string
  level: 'success' | 'error' | 'warning' | 'info'
  message: string
}

export interface ImportStats {
  totalCategories: number
  processedCategories: number
  currentCategory: string | null
  currentCategoryName: string | null
  totalProducts: number
  imported: number
  updated: number
  failed: number
  duration: number
  isRunning: boolean
  estimatedTimeRemaining: number | null // seconds
  importSpeed: number | null // products per minute
  progressPercent: number
}

export interface ImportSettings {
  selectedCategorySlugs: string[] // Array of Level 2 category slugs to import
  updateExisting: boolean
  loadSpecs: boolean
}

class ImportService {
  private isRunning = false
  private shouldStop = false
  private logs: ImportLog[] = []
  private logIdCounter = 0
  private stats: ImportStats = {
    totalCategories: 0,
    processedCategories: 0,
    currentCategory: null,
    currentCategoryName: null,
    totalProducts: 0,
    imported: 0,
    updated: 0,
    failed: 0,
    duration: 0,
    isRunning: false,
    estimatedTimeRemaining: null,
    importSpeed: null,
    progressPercent: 0,
  }
  private startTime = 0
  private progressId: string | null = null

  /**
   * Start import process
   */
  async startImport(settings: ImportSettings): Promise<void> {
    if (this.isRunning) {
      throw new Error('Import already running')
    }

    this.isRunning = true
    this.shouldStop = false
    this.logs = []
    this.startTime = Date.now()

    this.addLog('info', 'Starting import from ChipDip...')

    // Create new progress record
    const progress = await prisma.importProgress.create({
      data: {
        status: 'running',
        startedAt: new Date(),
      },
    })
    this.progressId = progress.id

    this.stats.isRunning = true

    // Run import in background
    this.runImport(settings).catch((error) => {
      this.addLog('error', `Import failed: ${error.message}`)
      this.isRunning = false
      this.stats.isRunning = false
      
      if (this.progressId) {
        prisma.importProgress.update({
          where: { id: this.progressId },
          data: { status: 'failed', completedAt: new Date() },
        }).catch(console.error)
      }
    })
  }

  /**
   * Stop import process
   */
  async stopImport(): Promise<void> {
    if (!this.isRunning) {
      throw new Error('No import running')
    }

    this.shouldStop = true
    this.addLog('warning', 'Stopping import...')

    // Update progress status to paused
    if (this.progressId) {
      await prisma.importProgress.update({
        where: { id: this.progressId },
        data: { status: 'paused' },
      })
    }
  }

  /**
   * Get current import status
   */
  getStatus(): { stats: ImportStats; logs: ImportLog[] } {
    if (this.isRunning) {
      this.stats.duration = Math.floor((Date.now() - this.startTime) / 1000)
      
      // Calculate progress percentage
      if (this.stats.totalProducts > 0) {
        const completed = this.stats.imported + this.stats.updated + this.stats.failed
        this.stats.progressPercent = Math.floor((completed / this.stats.totalProducts) * 100)
      }
    }

    return {
      stats: { ...this.stats },
      logs: [...this.logs],
    }
  }

  /**
   * Main import logic
   */
  private async runImport(settings: ImportSettings): Promise<void> {
    let browserClient = null
    
    try {
      // Create browser client for JavaScript-rendered pages
      this.addLog('info', 'Launching browser...')
      browserClient = await createBrowserClient({
        headless: true,
        timeout: 30000,
        blockResources: true,
      })

      // Create HTTP client with rate limiter for product pages
      const rateLimiter = createRateLimiter({ maxRequests: 1, interval: 2000 })
      const httpClient = createHttpClient(
        {
          ...DEFAULT_HTTP_CONFIG,
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
        {
          rateLimiter,
          fetch: globalThis.fetch,
        }
      )

      // Get selected categories to import
      if (settings.selectedCategorySlugs.length === 0) {
        this.addLog('error', 'No categories selected for import')
        return
      }

      // Fetch selected categories from database
      const categoriesToImport = await prisma.category.findMany({
        where: {
          slug: { in: settings.selectedCategorySlugs },
        },
        select: {
          id: true,
          slug: true,
          name: true,
        },
      })

      if (categoriesToImport.length === 0) {
        this.addLog('error', 'Selected categories not found in database')
        return
      }

      this.addLog('info', `Importing ${categoriesToImport.length} selected categories`)

      this.stats.totalCategories = categoriesToImport.length

      // Update progress
      await this.updateProgress()

      // Import each category
      for (let catIndex = 0; catIndex < categoriesToImport.length; catIndex++) {
        if (this.shouldStop) {
          this.addLog('warning', 'Import stopped by user')
          break
        }

        const category = categoriesToImport[catIndex]
        this.stats.currentCategory = category.slug
        this.stats.currentCategoryName = category.name

        this.addLog('info', `[${catIndex + 1}/${categoriesToImport.length}] Processing category: ${category.name}`)

        // Check how many products already imported in this category
        const existingCount = await prisma.product.count({
          where: { categoryId: category.id },
        })

        this.addLog('info', `Category ${category.name} has ${existingCount} products already imported`)

        // Fetch catalog page
        const catalogUrl = `https://www.chipdip.ru/catalog/${category.slug}`
        
        try {
          const catalogHtml = await browserClient.fetchPage(catalogUrl)
          
          // Extract pagination info
          const paginationInfo = extractPaginationInfo(catalogHtml)
          const totalPages = paginationInfo?.totalPages || 1
          
          this.addLog('info', `Category has ${totalPages} page(s)`)

          // Import products from all pages
          for (let page = 1; page <= totalPages; page++) {
            if (this.shouldStop) break

            const pageUrl = page === 1 ? catalogUrl : `${catalogUrl}?page=${page}`
            this.addLog('info', `Fetching page ${page}/${totalPages}`)

            const pageHtml = await browserClient.fetchPage(pageUrl)
            const productSlugs = scrapeCatalogPage(pageHtml)

            if (productSlugs.length === 0) {
              this.addLog('warning', `No products found on page ${page}`)
              continue
            }

            this.addLog('info', `Found ${productSlugs.length} products on page ${page}`)
            this.stats.totalProducts += productSlugs.length

            // Import each product
            for (let i = 0; i < productSlugs.length; i++) {
              if (this.shouldStop) break

              const totalProcessed = this.stats.imported + this.stats.updated + this.stats.failed
              const slug = productSlugs[i]
              const progress = `[${totalProcessed + 1}/${this.stats.totalProducts}]`

              try {
                // Check if product already exists
                const existingProduct = await prisma.product.findUnique({
                  where: { slug },
                })

                if (existingProduct && !settings.updateExisting) {
                  this.addLog('info', `${progress} Skipping ${slug} (already exists)`)
                  this.stats.updated++
                  continue
                }

                this.addLog('info', `${progress} Fetching ${slug}...`)

                // Fetch product page using browser client to bypass captcha
                const productUrl = `https://www.chipdip.ru/product/${slug}`
                const productHtml = await browserClient!.fetchPage(productUrl)

                // Parse product data
                const parseResult = parseProductPage(productHtml)

                if (!parseResult.success) {
                  this.addLog('error', `${progress} Failed to parse ${slug}: ${parseResult.error}`)
                  this.stats.failed++
                  continue
                }

                const parsedProduct = parseResult.data!

                // Import to database
                const isUpdate = await this.importProductToDatabase(
                  slug,
                  parsedProduct,
                  category.id,
                  settings
                )

                if (isUpdate) {
                  this.stats.updated++
                  this.addLog('success', `${progress} Updated ${parsedProduct.name}`)
                } else {
                  this.stats.imported++
                  this.addLog('success', `${progress} Imported ${parsedProduct.name}`)
                }

                // Calculate import speed and ETA
                this.calculateMetrics()

                // Update progress every 10 products
                if ((this.stats.imported + this.stats.updated) % 10 === 0) {
                  await this.updateProgress()
                }

              } catch (error) {
                this.stats.failed++
                const errorMessage = error instanceof Error ? error.message : 'Unknown error'
                this.addLog('error', `${progress} Failed ${slug}: ${errorMessage}`)
              }
            }
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          this.addLog('error', `Failed to process category ${category.name}: ${errorMessage}`)
        }

        this.stats.processedCategories++
        await this.updateProgress()
      }

      // Import completed
      this.stats.duration = Math.floor((Date.now() - this.startTime) / 1000)
      this.addLog('success', `Import completed! Categories: ${this.stats.processedCategories}/${this.stats.totalCategories}, Imported: ${this.stats.imported}, Updated: ${this.stats.updated}, Failed: ${this.stats.failed}`)

      // Update progress to completed
      if (this.progressId) {
        await prisma.importProgress.update({
          where: { id: this.progressId },
          data: {
            status: 'completed',
            completedAt: new Date(),
          },
        })
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.addLog('error', `Import failed: ${errorMessage}`)
    } finally {
      // Close browser
      if (browserClient) {
        this.addLog('info', 'Closing browser...')
        await browserClient.close()
      }
      
      this.isRunning = false
      this.stats.isRunning = false
    }
  }

  /**
   * Import product to database
   */
  private async importProductToDatabase(
    slug: string,
    parsedProduct: ParsedProduct,
    categoryId: string,
    settings: ImportSettings
  ): Promise<boolean> {
    let isUpdate = false

    await prisma.$transaction(async (tx) => {
      // Validate required fields
      if (!parsedProduct.manufacturer) {
        throw new Error('Manufacturer is required')
      }

      if (!parsedProduct.partNumber) {
        throw new Error('Part number is required')
      }

      // Find or create manufacturer
      const manufacturerSlug = parsedProduct.manufacturer
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      const manufacturer = await tx.manufacturer.upsert({
        where: { slug: manufacturerSlug },
        update: {},
        create: {
          name: parsedProduct.manufacturer,
          slug: manufacturerSlug,
        },
      })

      // Check if product exists
      const existingProduct = await tx.product.findUnique({
        where: { slug },
      })

      isUpdate = !!existingProduct

      // Upsert product
      const product = await tx.product.upsert({
        where: { slug },
        update: settings.updateExisting
          ? {
              name: parsedProduct.name,
              partNumber: parsedProduct.partNumber,
              sku: parsedProduct.sku,
              description: parsedProduct.description,
              weight: parsedProduct.weight,
              manufacturerId: manufacturer.id,
              categoryId: categoryId,
            }
          : {},
        create: {
          slug,
          name: parsedProduct.name,
          partNumber: parsedProduct.partNumber,
          sku: parsedProduct.sku,
          description: parsedProduct.description,
          weight: parsedProduct.weight,
          manufacturerId: manufacturer.id,
          categoryId: categoryId,
        },
      })

      // Delete existing related data
      await tx.specification.deleteMany({ where: { productId: product.id } })
      await tx.datasheet.deleteMany({ where: { productId: product.id } })

      // Images import disabled - will be handled separately later

      // Insert specifications
      if (settings.loadSpecs) {
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
    })

    return isUpdate
  }

  /**
   * Calculate import speed and estimated time remaining
   */
  private calculateMetrics(): void {
    const elapsedSeconds = (Date.now() - this.startTime) / 1000
    const completedProducts = this.stats.imported + this.stats.updated + this.stats.failed

    if (elapsedSeconds > 0 && completedProducts > 0) {
      // Products per minute
      this.stats.importSpeed = (completedProducts / elapsedSeconds) * 60

      // Remaining products
      const remainingProducts = this.stats.totalProducts - completedProducts

      if (remainingProducts > 0 && this.stats.importSpeed > 0) {
        // ETA in seconds
        this.stats.estimatedTimeRemaining = Math.floor(
          (remainingProducts / this.stats.importSpeed) * 60
        )
      }
    }
  }

  /**
   * Update progress in database
   */
  private async updateProgress(): Promise<void> {
    if (!this.progressId) return

    try {
      await prisma.importProgress.update({
        where: { id: this.progressId },
        data: {
          currentCategoryId: this.stats.currentCategory || undefined,
          currentCategorySlug: this.stats.currentCategory || undefined,
          currentCategoryName: this.stats.currentCategoryName || undefined,
          totalCategories: this.stats.totalCategories,
          processedCategories: this.stats.processedCategories,
          totalProducts: this.stats.totalProducts,
          importedProducts: this.stats.imported,
          updatedProducts: this.stats.updated,
          failedProducts: this.stats.failed,
          estimatedTimeRemaining: this.stats.estimatedTimeRemaining,
          importSpeed: this.stats.importSpeed,
        },
      })
    } catch (error) {
      console.error('Failed to update progress:', error)
    }
  }

  /**
   * Add log entry
   */
  private addLog(level: ImportLog['level'], message: string): void {
    const log: ImportLog = {
      id: this.logIdCounter++,
      timestamp: new Date().toISOString(),
      level,
      message,
    }

    this.logs.push(log)

    // Keep only last 100 logs
    if (this.logs.length > 100) {
      this.logs.shift()
    }
  }
}

// Singleton instance
export const importService = new ImportService()
