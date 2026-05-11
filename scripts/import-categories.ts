import { prisma } from '../src/lib/prisma'
import { createHttpClient } from '../src/lib/parser/http-client'
import { createRateLimiter } from '../src/lib/parser/rate-limiter'
import { parseCatalogCategories, extractMainCategoryInfo } from '../src/lib/parser/category-parser'

const MAIN_CATEGORY_URL = 'https://www.chipdip.ru/catalog/mikroshemy-1731'

async function importCategories() {
  console.log('🚀 Starting category import from ChipDip...\n')

  // Create HTTP client with rate limiter (0.5 req/sec to avoid blocking)
  const rateLimiter = createRateLimiter({ maxRequests: 1, interval: 2000 })
  const httpClient = createHttpClient(
    {
      timeout: 10000,
      maxRetries: 3,
      backoffMs: 1000,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    {
      rateLimiter,
      fetch: globalThis.fetch,
    }
  )

  try {
    // Step 1: Fetch main category page
    console.log(`📥 Fetching main category: ${MAIN_CATEGORY_URL}`)
    const html = await httpClient.get(MAIN_CATEGORY_URL)

    // Step 2: Extract main category info
    const mainCategoryInfo = extractMainCategoryInfo(html)
    if (!mainCategoryInfo) {
      throw new Error('Failed to extract main category info')
    }

    console.log(`📦 Main category: ${mainCategoryInfo.name} (${mainCategoryInfo.productCount.toLocaleString()} products)\n`)

    // Step 3: Create or update main category in database
    const mainCategory = await prisma.category.upsert({
      where: { slug: mainCategoryInfo.slug },
      update: {
        name: mainCategoryInfo.name,
      },
      create: {
        slug: mainCategoryInfo.slug,
        name: mainCategoryInfo.name,
        icon: 'Cpu', // Default icon for electronics
        description: `Категория ${mainCategoryInfo.name} содержит ${mainCategoryInfo.productCount.toLocaleString()} товаров`,
      },
    })

    console.log(`✅ Main category saved: ${mainCategory.name} (ID: ${mainCategory.id})\n`)

    // Step 4: Parse subcategories
    const subcategories = parseCatalogCategories(html, mainCategory.slug)
    console.log(`📋 Found ${subcategories.length} subcategories\n`)

    // Step 5: Import subcategories to database
    let imported = 0
    let skipped = 0

    for (const subcat of subcategories) {
      try {
        const category = await prisma.category.upsert({
          where: { slug: subcat.slug },
          update: {
            name: subcat.name,
            parentId: mainCategory.id,
          },
          create: {
            slug: subcat.slug,
            name: subcat.name,
            icon: 'Cpu',
            description: `${subcat.name} - ${subcat.productCount.toLocaleString()} товаров`,
            parentId: mainCategory.id,
          },
        })

        imported++
        console.log(`✅ [${imported}/${subcategories.length}] ${category.name} (${subcat.productCount.toLocaleString()} products)`)
      } catch (error) {
        skipped++
        console.error(`❌ Failed to import ${subcat.name}:`, error)
      }
    }

    // Step 6: Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 Import Summary:')
    console.log('='.repeat(60))
    console.log(`✅ Main category: ${mainCategory.name}`)
    console.log(`✅ Subcategories imported: ${imported}`)
    console.log(`❌ Subcategories skipped: ${skipped}`)
    console.log(`📦 Total products available: ${subcategories.reduce((sum, cat) => sum + cat.productCount, 0).toLocaleString()}`)
    console.log('='.repeat(60))

    // Step 7: Display category tree
    console.log('\n📂 Category Tree:')
    console.log(`└─ ${mainCategory.name}`)
    const savedSubcategories = await prisma.category.findMany({
      where: { parentId: mainCategory.id },
      orderBy: { name: 'asc' },
    })
    savedSubcategories.forEach((cat, index) => {
      const isLast = index === savedSubcategories.length - 1
      const prefix = isLast ? '   └─' : '   ├─'
      const subcat = subcategories.find(s => s.slug === cat.slug)
      const count = subcat ? ` (${subcat.productCount.toLocaleString()} products)` : ''
      console.log(`${prefix} ${cat.name}${count}`)
    })

  } catch (error) {
    console.error('\n❌ Import failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run import
importCategories()
