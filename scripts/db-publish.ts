/**
 * db:publish — публикация каталога из локальной БД (Docker) в продовую (Supabase).
 *
 * Модель: локальная БД — источник правды по КАТАЛОГУ; продовая БД дополнительно
 * хранит клиентские данные (заявки), которые рождаются только в проде.
 *
 * Зеркалируются (prod становится копией local):
 *   Manufacturer, Category, Product, ProductImage, Specification, Datasheet, ProductAnalog
 *
 * Никогда не трогаются в проде:
 *   QuoteRequest, QuoteRequestItem  — заявки клиентов (нет FK на Product — безопасно)
 *   EnrichmentJournal, ImportProgress — рабочее состояние парсера, в прод не публикуется
 *
 * Запуск:
 *   npm run db:publish           — публикация
 *   npm run db:publish -- --dry-run  — только показать diff, ничего не менять
 *
 * Env:
 *   DATABASE_URL          — локальная БД (источник)
 *   PUBLISH_DATABASE_URL  — продовая БД (Supabase, session-порт 5432, НЕ pgbouncer)
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const CHUNK = 1000
const dryRun = process.argv.includes('--dry-run')

const sourceUrl = process.env.DATABASE_URL
const targetUrl = process.env.PUBLISH_DATABASE_URL

if (!sourceUrl || !targetUrl) {
  console.error('Нужны DATABASE_URL (local) и PUBLISH_DATABASE_URL (Supabase) в .env')
  process.exit(1)
}
if (/pgbouncer=true|:6543\//.test(targetUrl)) {
  console.error('PUBLISH_DATABASE_URL должен указывать на session-порт 5432 без pgbouncer (транзакции).')
  process.exit(1)
}

const local = new PrismaClient({ datasources: { db: { url: sourceUrl } } })
const prod = new PrismaClient({ datasources: { db: { url: targetUrl } } })

const chunks = <T>(arr: T[]): T[][] => {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += CHUNK) out.push(arr.slice(i, i + CHUNK))
  return out
}

async function main() {
  console.log(`Источник:  ${sourceUrl!.replace(/:[^:@/]+@/, ':***@')}`)
  console.log(`Назначение: ${targetUrl!.replace(/:[^:@/]+@/, ':***@')}`)
  if (dryRun) console.log('Режим: DRY-RUN (без изменений)\n')

  // 1. Читаем каталог из локальной БД
  const [manufacturers, categories, products, images, specs, datasheets, analogs] =
    await Promise.all([
      local.manufacturer.findMany(),
      local.category.findMany(),
      local.product.findMany(),
      local.productImage.findMany(),
      local.specification.findMany(),
      local.datasheet.findMany(),
      local.productAnalog.findMany(),
    ])

  const localCounts = {
    Manufacturer: manufacturers.length,
    Category: categories.length,
    Product: products.length,
    ProductImage: images.length,
    Specification: specs.length,
    Datasheet: datasheets.length,
    ProductAnalog: analogs.length,
  }

  const prodCounts = {
    Manufacturer: await prod.manufacturer.count(),
    Category: await prod.category.count(),
    Product: await prod.product.count(),
    ProductImage: await prod.productImage.count(),
    Specification: await prod.specification.count(),
    Datasheet: await prod.datasheet.count(),
    ProductAnalog: await prod.productAnalog.count(),
  }

  console.log('Таблица            local → prod (до публикации)')
  for (const k of Object.keys(localCounts) as (keyof typeof localCounts)[]) {
    console.log(`  ${k.padEnd(16)} ${String(localCounts[k]).padStart(6)} → ${prodCounts[k]}`)
  }
  const quotes = await prod.quoteRequest.count()
  console.log(`  (в проде заявок клиентов: ${quotes} — не трогаем)\n`)

  if (dryRun) {
    console.log('DRY-RUN завершён. Запусти без --dry-run для публикации.')
    return
  }

  // 2. Атомарная замена каталога в проде (заявки живут в других таблицах)
  console.log('Публикация (одна транзакция, читатели не блокируются)...')
  const t0 = Date.now()
  await prod.$transaction(
    async (tx) => {
      // children → parents
      await tx.productAnalog.deleteMany()
      await tx.specification.deleteMany()
      await tx.productImage.deleteMany()
      await tx.datasheet.deleteMany()
      await tx.product.deleteMany()
      await tx.category.deleteMany() // self-FK ON DELETE CASCADE
      await tx.manufacturer.deleteMany()

      // parents → children
      for (const c of chunks(manufacturers)) await tx.manufacturer.createMany({ data: c })

      // Category: 2 прохода из-за self-FK parentId
      for (const c of chunks(categories.map((x) => ({ ...x, parentId: null }))))
        await tx.category.createMany({ data: c })
      for (const cat of categories.filter((x) => x.parentId)) {
        await tx.category.update({ where: { id: cat.id }, data: { parentId: cat.parentId } })
      }

      for (const c of chunks(products)) await tx.product.createMany({ data: c })
      for (const c of chunks(images)) await tx.productImage.createMany({ data: c })
      for (const c of chunks(specs)) await tx.specification.createMany({ data: c })
      for (const c of chunks(datasheets)) await tx.datasheet.createMany({ data: c })
      for (const c of chunks(analogs)) await tx.productAnalog.createMany({ data: c })
    },
    { timeout: 15 * 60_000, maxWait: 60_000 },
  )
  console.log(`Транзакция применена за ${((Date.now() - t0) / 1000).toFixed(1)}с`)

  // 3. Верификация
  const after = {
    Manufacturer: await prod.manufacturer.count(),
    Category: await prod.category.count(),
    Product: await prod.product.count(),
    ProductImage: await prod.productImage.count(),
    Specification: await prod.specification.count(),
    Datasheet: await prod.datasheet.count(),
    ProductAnalog: await prod.productAnalog.count(),
  }
  let ok = true
  console.log('\nВерификация:')
  for (const k of Object.keys(localCounts) as (keyof typeof localCounts)[]) {
    const match = after[k] === localCounts[k]
    if (!match) ok = false
    console.log(`  ${match ? '✓' : '✗'} ${k.padEnd(16)} prod=${after[k]} ожидалось=${localCounts[k]}`)
  }
  const quotesAfter = await prod.quoteRequest.count()
  console.log(`  ${quotesAfter === quotes ? '✓' : '✗'} заявки клиентов: ${quotesAfter} (было ${quotes})`)
  if (!ok || quotesAfter !== quotes) {
    console.error('\nРасхождение счётчиков — проверь вручную!')
    process.exit(1)
  }
  console.log('\nКаталог опубликован. Прод-сайт уже отдаёт новые данные.')
}

main()
  .catch((e) => {
    console.error('Ошибка публикации (транзакция откатена, прод не изменён):', e)
    process.exit(1)
  })
  .finally(async () => {
    await local.$disconnect()
    await prod.$disconnect()
  })
