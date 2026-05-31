/**
 * Перестроение дерева категорий каталога.
 *
 * Приводит хаотичный плоский набор категорий к чистой 2-уровневой иерархии
 * РАЗДЕЛ → подкатегория на основе канонической таксономии
 * (src/lib/catalog/taxonomy.ts):
 *
 *  - классифицирует каждый товар в раздел (по текущей категории, имени, корпусу)
 *  - создаёт фиксированные разделы верхнего уровня и товарные подкатегории
 *  - сливает дубликаты (в т.ч. англоязычные LCSC/Mouser → русские)
 *  - удаляет пустые категории-призраки
 *
 * Запуск:
 *   pnpm tsx scripts/rebuild-category-tree.ts            # dry-run (только отчёт)
 *   pnpm tsx scripts/rebuild-category-tree.ts --apply    # применить к БД
 */

import { prisma } from '../src/lib/prisma'
import {
  classifyProduct,
  isJunkLeafName,
  normalizeLeafName,
  sectionBySlug,
  toSlug,
  SECTIONS,
} from '../src/lib/catalog/taxonomy'

const APPLY = process.argv.includes('--apply')

interface Plan {
  productId: string
  sectionSlug: string
  leafSlug: string | null
  leafName: string | null
  needsReview: boolean
}

/** Определяет целевую категорию (раздел или подкатегорию) для товара. */
function planProduct(
  productName: string,
  partNumber: string | null,
  pkg: string | null,
  currentCategoryName: string | null,
  source: string | null,
): Plan {
  const junk = isJunkLeafName(currentCategoryName)

  const sectionSlug = classifyProduct({
    categoryName: currentCategoryName,
    productName,
    mpn: partNumber,
    package: pkg,
  })

  const base = {
    productId: '',
    sectionSlug,
    needsReview: source !== null && source !== 'chipdip',
  }

  if (junk) {
    return { ...base, leafSlug: null, leafName: null }
  }

  const leafName = normalizeLeafName(currentCategoryName as string)
  const leafSlug = toSlug(leafName)
  if (!leafSlug || leafSlug === sectionSlug) {
    return { ...base, leafSlug: null, leafName: null }
  }
  return { ...base, leafSlug, leafName }
}

async function main() {
  console.log(`\n=== Rebuild category tree (${APPLY ? 'APPLY' : 'DRY-RUN'}) ===\n`)

  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      partNumber: true,
      package: true,
      enrichmentMeta: true,
      category: { select: { name: true } },
    },
  })
  console.log(`Loaded ${products.length} products`)

  // 1. Построить план для каждого товара
  const plans: Plan[] = []
  for (const p of products) {
    const source =
      (p.enrichmentMeta as { category?: { source?: string } } | null)?.category?.source ?? null
    const plan = planProduct(p.name, p.partNumber, p.package, p.category?.name ?? null, source)
    plan.productId = p.id
    plans.push(plan)
  }

  // 2. Собрать нужные разделы и подкатегории
  const neededSections = new Set<string>()
  // leafSlug → { name, sectionSlug, needsReview }
  const neededLeaves = new Map<string, { name: string; sectionSlug: string; needsReview: boolean }>()

  for (const plan of plans) {
    neededSections.add(plan.sectionSlug)
    if (plan.leafSlug && plan.leafName) {
      const existing = neededLeaves.get(plan.leafSlug)
      if (!existing) {
        neededLeaves.set(plan.leafSlug, {
          name: plan.leafName,
          sectionSlug: plan.sectionSlug,
          needsReview: plan.needsReview,
        })
      } else if (existing.needsReview && !plan.needsReview) {
        // предпочесть провенанс chipdip
        existing.needsReview = false
      }
    }
  }

  // 3. Сводка по разделам
  const perSection = new Map<string, { direct: number; leaves: Map<string, number> }>()
  for (const plan of plans) {
    if (!perSection.has(plan.sectionSlug)) perSection.set(plan.sectionSlug, { direct: 0, leaves: new Map() })
    const bucket = perSection.get(plan.sectionSlug)!
    if (plan.leafSlug) bucket.leaves.set(plan.leafSlug, (bucket.leaves.get(plan.leafSlug) ?? 0) + 1)
    else bucket.direct += 1
  }

  console.log('\nTarget tree:')
  for (const section of SECTIONS) {
    const bucket = perSection.get(section.slug)
    if (!bucket) continue
    const totalLeaf = [...bucket.leaves.values()].reduce((a, b) => a + b, 0)
    const total = totalLeaf + bucket.direct
    console.log(`\n  ▸ ${section.name} [${section.slug}] — ${total} товаров`)
    if (bucket.direct) console.log(`      · (напрямую в раздел): ${bucket.direct}`)
    const leafEntries = [...bucket.leaves.entries()].sort((a, b) => b[1] - a[1])
    for (const [slug, n] of leafEntries) {
      console.log(`      · ${neededLeaves.get(slug)?.name ?? slug}: ${n}`)
    }
  }

  const before = await prisma.category.count()
  console.log(
    `\nCategories: before=${before}  → sections=${neededSections.size}  leaves=${neededLeaves.size}  total=${neededSections.size + neededLeaves.size}`,
  )

  if (!APPLY) {
    console.log('\n(DRY-RUN) Ничего не записано. Запусти с --apply для применения.\n')
    await prisma.$disconnect()
    return
  }

  // 4. APPLY — upsert разделов
  console.log('\nApplying...')
  const sectionId = new Map<string, string>()
  for (const slug of neededSections) {
    const s = sectionBySlug(slug)!
    const cat = await prisma.category.upsert({
      where: { slug: s.slug },
      create: { slug: s.slug, name: s.name, icon: s.icon, parentId: null, nameNeedsReview: false },
      update: { name: s.name, icon: s.icon, parentId: null },
    })
    sectionId.set(slug, cat.id)
  }
  console.log(`  Upserted ${sectionId.size} sections`)

  // 5. Upsert подкатегорий под разделами
  const leafId = new Map<string, string>()
  for (const [slug, info] of neededLeaves) {
    const parentId = sectionId.get(info.sectionSlug)!
    const cat = await prisma.category.upsert({
      where: { slug },
      create: { slug, name: info.name, parentId, nameNeedsReview: info.needsReview },
      update: { name: info.name, parentId, nameNeedsReview: info.needsReview },
    })
    leafId.set(slug, cat.id)
  }
  console.log(`  Upserted ${leafId.size} leaf categories`)

  // 6. Переназначить товары (группами по целевой категории)
  const groups = new Map<string, string[]>() // targetCategoryId → productIds
  for (const plan of plans) {
    const targetId = plan.leafSlug ? leafId.get(plan.leafSlug)! : sectionId.get(plan.sectionSlug)!
    if (!groups.has(targetId)) groups.set(targetId, [])
    groups.get(targetId)!.push(plan.productId)
  }
  let moved = 0
  for (const [categoryId, ids] of groups) {
    // обновляем чанками, чтобы не упереться в лимиты параметров
    for (let i = 0; i < ids.length; i += 500) {
      const chunk = ids.slice(i, i + 500)
      const res = await prisma.product.updateMany({
        where: { id: { in: chunk } },
        data: { categoryId },
      })
      moved += res.count
    }
  }
  console.log(`  Reassigned ${moved} products into ${groups.size} categories`)

  // 7. Удалить осиротевшие категории (0 товаров, 0 детей, вне нового дерева).
  //    Старая иерархия могла быть глубокой — чистим послойно, пока есть что удалять.
  const keepIds = new Set<string>([...sectionId.values(), ...leafId.values()])
  let totalDeleted = 0
  for (let pass = 0; pass < 10; pass++) {
    const deleted = await prisma.category.deleteMany({
      where: {
        id: { notIn: [...keepIds] },
        products: { none: {} },
        children: { none: {} },
      },
    })
    totalDeleted += deleted.count
    if (deleted.count === 0) break
  }
  console.log(`  Deleted ${totalDeleted} empty/orphan categories`)

  const after = await prisma.category.count()
  console.log(`\nDone. Categories: ${before} → ${after}\n`)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
