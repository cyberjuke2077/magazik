import { prisma } from '../src/lib/prisma'
import { createHttpClient } from '../src/lib/parser/http-client'
import { createRateLimiter } from '../src/lib/parser/rate-limiter'
import { parseLevel1Categories, parseLevel2Categories, extractMainCategoryInfo } from '../src/lib/parser/category-parser'

const ROOT_CATEGORY_URL = 'https://www.chipdip.ru/catalog/elektronnye-komponenty-1730'

async function importAllCategories() {
  console.log('🚀 Starting full category hierarchy import from ChipDip...\n')

  // Create HTTP client with rate limiter (1 req per 2 seconds to avoid blocking)
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
    // ========================================
    // LEVEL 0: Root category "Электронные компоненты"
    // ========================================
    console.log(`📥 Fetching root category: ${ROOT_CATEGORY_URL}`)
    const rootHtml = await httpClient.get(ROOT_CATEGORY_URL)

    const rootCategoryInfo = extractMainCategoryInfo(rootHtml)
    if (!rootCategoryInfo) {
      throw new Error('Failed to extract root category info')
    }

    console.log(`📦 Root category: ${rootCategoryInfo.name} (${rootCategoryInfo.productCount.toLocaleString()} products)\n`)

    const rootCategory = await prisma.category.upsert({
      where: { slug: rootCategoryInfo.slug },
      update: {
        name: rootCategoryInfo.name,
      },
      create: {
        slug: rootCategoryInfo.slug,
        name: rootCategoryInfo.name,
        icon: 'Cpu',
        description: `Корневая категория ${rootCategoryInfo.name}`,
      },
    })

    console.log(`✅ Root category saved: ${rootCategory.name} (ID: ${rootCategory.id})\n`)

    // ========================================
    // LEVEL 1: Main categories (Микросхемы, Резисторы, Конденсаторы и т.д.)
    // ========================================
    const level1Categories = parseLevel1Categories(rootHtml, rootCategory.slug)
    console.log(`📋 Found ${level1Categories.length} level 1 categories\n`)

    let level1Imported = 0
    let level2TotalImported = 0

    for (const level1Cat of level1Categories) {
      try {
        // Save level 1 category
        const level1Category = await prisma.category.upsert({
          where: { slug: level1Cat.slug },
          update: {
            name: level1Cat.name,
            parentId: rootCategory.id,
          },
          create: {
            slug: level1Cat.slug,
            name: level1Cat.name,
            icon: 'Cpu',
            description: `${level1Cat.name} - ${level1Cat.productCount.toLocaleString()} товаров`,
            parentId: rootCategory.id,
          },
        })

        level1Imported++
        console.log(`✅ [${level1Imported}/${level1Categories.length}] ${level1Category.name} (${level1Cat.productCount.toLocaleString()} products)`)

        // ========================================
        // LEVEL 2: Subcategories for each level 1 category
        // ========================================
        console.log(`   📥 Fetching subcategories for ${level1Cat.name}...`)
        const level1Html = await httpClient.get(level1Cat.url)
        const level2Categories = parseLevel2Categories(level1Html, level1Category.slug)

        if (level2Categories.length > 0) {
          console.log(`   📋 Found ${level2Categories.length} subcategories`)

          for (const level2Cat of level2Categories) {
            try {
              await prisma.category.upsert({
                where: { slug: level2Cat.slug },
                update: {
                  name: level2Cat.name,
                  parentId: level1Category.id,
                },
                create: {
                  slug: level2Cat.slug,
                  name: level2Cat.name,
                  icon: 'Cpu',
                  description: `${level2Cat.name} - ${level2Cat.productCount.toLocaleString()} товаров`,
                  parentId: level1Category.id,
                },
              })

              level2TotalImported++
            } catch (error) {
              console.error(`   ❌ Failed to import subcategory ${level2Cat.name}:`, error)
            }
          }

          console.log(`   ✅ Imported ${level2Categories.length} subcategories\n`)
        } else {
          console.log(`   ℹ️  No subcategories found\n`)
        }

      } catch (error) {
        console.error(`❌ Failed to import level 1 category ${level1Cat.name}:`, error)
      }
    }

    // ========================================
    // SUMMARY
    // ========================================
    console.log('\n' + '='.repeat(60))
    console.log('📊 Import Summary:')
    console.log('='.repeat(60))
    console.log(`✅ Root category: ${rootCategory.name}`)
    console.log(`✅ Level 1 categories imported: ${level1Imported}`)
    console.log(`✅ Level 2 categories imported: ${level2TotalImported}`)
    console.log(`📦 Total products available: ${level1Categories.reduce((sum, cat) => sum + cat.productCount, 0).toLocaleString()}`)
    console.log('='.repeat(60))

    // ========================================
    // DISPLAY CATEGORY TREE
    // ========================================
    console.log('\n📂 Category Tree (first 5 level 1 categories):')
    console.log(`└─ ${rootCategory.name}`)
    
    const savedLevel1Categories = await prisma.category.findMany({
      where: { parentId: rootCategory.id },
      orderBy: { name: 'asc' },
      take: 5,
      include: {
        children: {
          orderBy: { name: 'asc' },
          take: 3,
        },
      },
    })

    savedLevel1Categories.forEach((cat, index) => {
      const isLast = index === savedLevel1Categories.length - 1
      const prefix = isLast ? '   └─' : '   ├─'
      const level1Cat = level1Categories.find(c => c.slug === cat.slug)
      const count = level1Cat ? ` (${level1Cat.productCount.toLocaleString()} products)` : ''
      console.log(`${prefix} ${cat.name}${count}`)

      cat.children.forEach((child, childIndex) => {
        const isLastChild = childIndex === cat.children.length - 1
        const childPrefix = isLast ? '      └─' : '      ├─'
        console.log(`${childPrefix} ${child.name}`)
      })

      if (cat.children.length > 0) {
        console.log(`      ... (${cat.children.length} subcategories total)`)
      }
    })

    console.log(`   ... (${level1Imported} level 1 categories total)`)

  } catch (error) {
    console.error('\n❌ Import failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run import
importAllCategories()
