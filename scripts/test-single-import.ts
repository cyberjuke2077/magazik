/**
 * Test Single Product Import
 * 
 * Tests the import pipeline with a single product: STM32F103C8T6
 * - Fetches and parses product page from ChipDip
 * - Imports to PostgreSQL database
 * - Verifies all data fields are populated correctly
 * - Logs results for manual verification
 */

import { prisma } from '../src/lib/prisma'
import { createHttpClient, DEFAULT_HTTP_CONFIG } from '../src/lib/parser/http-client'
import { createRateLimiter } from '../src/lib/parser/rate-limiter'
import { parseProductPage } from '../src/lib/parser/product-parser'
import type { ParsedProduct } from '../src/lib/parser/types'

const TEST_SLUG = 'stm32f103c8t6'
const TEST_URL = `https://www.chipdip.ru/product/${TEST_SLUG}`

/**
 * Fetches and parses product page
 */
async function fetchAndParseProduct(slug: string): Promise<ParsedProduct> {
  console.log(`\nFetching product: ${slug}`)
  console.log(`URL: ${TEST_URL}`)
  
  const rateLimiter = createRateLimiter({ requestsPerSecond: 1 })
  const httpClient = createHttpClient(DEFAULT_HTTP_CONFIG, {
    rateLimiter,
    fetch: globalThis.fetch,
  })
  
  const html = await httpClient.get(TEST_URL)
  const parseResult = parseProductPage(html)
  
  if (!parseResult.success) {
    throw new Error(parseResult.error || 'Failed to parse product page')
  }
  
  console.log(`  [DEBUG] Parsed weight: ${parseResult.data!.weight}`)
  
  return parseResult.data!
}

/**
 * Finds or creates manufacturer in database
 */
async function findOrCreateManufacturer(
  name: string,
  tx: typeof prisma
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
  tx: typeof prisma
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
 * Imports product to database with transaction
 */
async function importProductToDatabase(
  slug: string,
  parsedProduct: ParsedProduct
): Promise<void> {
  console.log('\nImporting to database...')
  
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
    
    console.log(`  Manufacturer: ${parsedProduct.manufacturer} (ID: ${manufacturerId})`)
    console.log(`  Category: ${parsedProduct.category} (ID: ${categoryId})`)
    
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
    
    console.log(`  Product created/updated: ${product.id}`)
    
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
      console.log(`  Images: ${parsedProduct.images.length} stored`)
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
      console.log(`  Specifications: ${specEntries.length} stored`)
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
      console.log(`  Datasheets: ${parsedProduct.datasheets.length} stored`)
    }
  })
}

/**
 * Verifies imported data in database
 */
async function verifyImportedData(slug: string): Promise<void> {
  console.log('\nVerifying imported data...')
  
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      manufacturer: true,
      category: true,
      images: true,
      specifications: true,
      datasheets: true,
    },
  })
  
  if (!product) {
    throw new Error(`Product ${slug} not found in database`)
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('VERIFICATION RESULTS')
  console.log('='.repeat(60))
  
  console.log('\nProduct:')
  console.log(`  ID: ${product.id}`)
  console.log(`  Slug: ${product.slug}`)
  console.log(`  Name: ${product.name}`)
  console.log(`  Part Number: ${product.partNumber}`)
  console.log(`  SKU: ${product.sku || 'N/A'}`)
  console.log(`  Description: ${product.description ? product.description.substring(0, 100) + '...' : 'N/A'}`)
  
  console.log('\nManufacturer:')
  console.log(`  Name: ${product.manufacturer.name}`)
  console.log(`  Slug: ${product.manufacturer.slug}`)
  
  console.log('\nCategory:')
  console.log(`  Name: ${product.category.name}`)
  console.log(`  Slug: ${product.category.slug}`)
  
  console.log('\nImages:')
  console.log(`  Count: ${product.images.length}`)
  product.images.slice(0, 3).forEach((img, idx) => {
    console.log(`  [${idx + 1}] ${img.imageUrl}`)
  })
  if (product.images.length > 3) {
    console.log(`  ... and ${product.images.length - 3} more`)
  }
  
  console.log('\nSpecifications:')
  console.log(`  Count: ${product.specifications.length}`)
  product.specifications.slice(0, 5).forEach((spec) => {
    console.log(`  ${spec.key}: ${spec.value}`)
  })
  if (product.specifications.length > 5) {
    console.log(`  ... and ${product.specifications.length - 5} more`)
  }
  
  console.log('\nDatasheets:')
  console.log(`  Count: ${product.datasheets.length}`)
  product.datasheets.forEach((ds, idx) => {
    console.log(`  [${idx + 1}] ${ds.url}`)
  })
  
  // Validation checks
  console.log('\n' + '='.repeat(60))
  console.log('VALIDATION CHECKS')
  console.log('='.repeat(60))
  
  const checks = [
    { name: 'Product name populated', pass: !!product.name },
    { name: 'Part number populated', pass: !!product.partNumber },
    { name: 'Manufacturer populated', pass: !!product.manufacturer },
    { name: 'Category populated', pass: !!product.category },
    { name: 'Images stored', pass: product.images.length > 0 },
    { name: 'Specifications stored', pass: product.specifications.length > 0 },
    { name: 'Datasheets stored', pass: product.datasheets.length > 0 },
  ]
  
  let allPassed = true
  checks.forEach((check) => {
    const status = check.pass ? '✅' : '❌'
    console.log(`${status} ${check.name}`)
    if (!check.pass) allPassed = false
  })
  
  console.log('\n' + '='.repeat(60))
  if (allPassed) {
    console.log('✅ ALL CHECKS PASSED')
  } else {
    console.log('❌ SOME CHECKS FAILED')
  }
  console.log('='.repeat(60))
}

/**
 * Main test function
 */
async function main(): Promise<void> {
  console.log('Test Single Product Import')
  console.log('='.repeat(60))
  console.log(`Product: ${TEST_SLUG}`)
  console.log(`Time: ${new Date().toISOString()}`)
  
  const startTime = Date.now()
  
  try {
    // Step 1: Fetch and parse
    const parsedProduct = await fetchAndParseProduct(TEST_SLUG)
    console.log('✅ Product page fetched and parsed')
    
    // Step 2: Import to database
    await importProductToDatabase(TEST_SLUG, parsedProduct)
    console.log('✅ Product imported to database')
    
    // Step 3: Verify data
    await verifyImportedData(TEST_SLUG)
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`\n✅ Test completed successfully in ${duration}s`)
    
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Test failed:', error)
    
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Stack trace:', error.stack)
    }
    
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run test
main()
