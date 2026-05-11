/**
 * Import products from CSV to database
 * 
 * Bulk import is MUCH faster than individual inserts.
 * Can import millions of products in minutes.
 */

import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'
import { prisma } from '../src/lib/prisma'

interface CSVRow {
  slug: string
  name: string
  partNumber: string
  sku: string
  manufacturer: string
  manufacturerSlug: string
  categorySlug: string
  categoryName: string
  description: string
  weight: string
  specifications: string
  datasheets: string
  images: string
}

async function importFromCSV(csvFilePath: string) {
  console.log(`📂 Reading CSV: ${csvFilePath}`)
  
  const csvContent = fs.readFileSync(csvFilePath, 'utf-8')
  const rows: CSVRow[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
  })

  console.log(`📦 Found ${rows.length} products in CSV`)

  const stats = {
    manufacturers: 0,
    products: 0,
    specifications: 0,
    datasheets: 0,
    skipped: 0,
  }

  // Group by manufacturer
  const manufacturerMap = new Map<string, string>()
  for (const row of rows) {
    if (!manufacturerMap.has(row.manufacturerSlug)) {
      manufacturerMap.set(row.manufacturerSlug, row.manufacturer)
    }
  }

  console.log(`\n👷 Creating ${manufacturerMap.size} manufacturers...`)
  
  // Batch create manufacturers
  for (const [slug, name] of manufacturerMap.entries()) {
    await prisma.manufacturer.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    })
    stats.manufacturers++
  }

  console.log(`✅ Created ${stats.manufacturers} manufacturers`)

  // Get category IDs
  console.log(`\n📁 Loading categories...`)
  const categories = await prisma.category.findMany({
    select: { id: true, slug: true },
  })
  const categoryMap = new Map(categories.map(c => [c.slug, c.id]))

  // Get manufacturer IDs
  const manufacturers = await prisma.manufacturer.findMany({
    select: { id: true, slug: true },
  })
  const manufacturerIdMap = new Map(manufacturers.map(m => [m.slug, m.id]))

  console.log(`\n📦 Importing products in batches...`)
  
  const batchSize = 100
  let processed = 0

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize)
    
    try {
      await prisma.$transaction(async (tx) => {
        for (const row of batch) {
          const categoryId = categoryMap.get(row.categorySlug)
          const manufacturerId = manufacturerIdMap.get(row.manufacturerSlug)

          if (!categoryId || !manufacturerId) {
            console.log(`⚠️  Skipping ${row.slug}: missing category or manufacturer`)
            stats.skipped++
            continue
          }

          // Parse JSON fields
          let specifications = []
          let datasheets = []
          
          try {
            specifications = row.specifications ? JSON.parse(row.specifications) : []
            datasheets = row.datasheets ? JSON.parse(row.datasheets) : []
          } catch (e) {
            console.log(`⚠️  Failed to parse JSON for ${row.slug}`)
          }

          // Upsert product
          const product = await tx.product.upsert({
            where: { slug: row.slug },
            update: {
              name: row.name,
              partNumber: row.partNumber,
              sku: row.sku || null,
              description: row.description || null,
              weight: row.weight ? parseFloat(row.weight) : null,
              categoryId,
              manufacturerId,
            },
            create: {
              slug: row.slug,
              name: row.name,
              partNumber: row.partNumber,
              sku: row.sku || null,
              description: row.description || null,
              weight: row.weight ? parseFloat(row.weight) : null,
              categoryId,
              manufacturerId,
            },
          })

          stats.products++

          // Delete old specifications
          await tx.specification.deleteMany({
            where: { productId: product.id },
          })

          // Create specifications
          if (specifications.length > 0) {
            await tx.specification.createMany({
              data: specifications.map((spec: any) => ({
                productId: product.id,
                name: spec.name,
                value: spec.value,
              })),
            })
            stats.specifications += specifications.length
          }

          // Delete old datasheets
          await tx.datasheet.deleteMany({
            where: { productId: product.id },
          })

          // Create datasheets
          if (datasheets.length > 0) {
            // Filter out null/undefined values
            const validDatasheets = datasheets.filter((ds: any) => ds !== null && ds !== undefined)
            
            if (validDatasheets.length > 0) {
              await tx.datasheet.createMany({
                data: validDatasheets.map((ds: any) => {
                  // If ds is a string (URL), extract filename as title
                  if (typeof ds === 'string') {
                    const filename = ds.split('/').pop() || 'Datasheet'
                    return {
                      productId: product.id,
                      title: filename,
                      url: ds,
                    }
                  }
                  // If ds is an object with title and url
                  return {
                    productId: product.id,
                    title: ds.title || 'Datasheet',
                    url: ds.url,
                  }
                }),
              })
              stats.datasheets += validDatasheets.length
            }
          }
        }
      })

      processed += batch.length
      const percent = ((processed / rows.length) * 100).toFixed(1)
      console.log(`  Progress: ${processed}/${rows.length} (${percent}%)`)

    } catch (error) {
      console.error(`❌ Batch failed at ${i}:`, error)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('🎉 Import completed!')
  console.log(`📊 Stats:`)
  console.log(`  Manufacturers: ${stats.manufacturers}`)
  console.log(`  Products: ${stats.products}`)
  console.log(`  Specifications: ${stats.specifications}`)
  console.log(`  Datasheets: ${stats.datasheets}`)
  console.log(`  Skipped: ${stats.skipped}`)
  console.log('='.repeat(60))
}

async function main() {
  const csvPath = process.argv[2]

  if (!csvPath) {
    console.error('Usage: pnpm tsx scripts/import-from-csv.ts <csv-file>')
    console.error('Example: pnpm tsx scripts/import-from-csv.ts data/parsed/mikrokontrollery-1738.csv')
    process.exit(1)
  }

  if (!fs.existsSync(csvPath)) {
    console.error(`File not found: ${csvPath}`)
    process.exit(1)
  }

  await importFromCSV(csvPath)
  await prisma.$disconnect()
}

main().catch(console.error)
