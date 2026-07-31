/**
 * Откат дерева категорий к снимку из .tmp/db-backups.
 * Восстанавливает все категории (с исходными id/slug/parentId) и привязку
 * товаров к категориям, затем удаляет категории, которых не было в снимке.
 *
 *   npm exec tsx -- scripts/restore-category-backup.ts <stamp>
 *   например: npm exec tsx -- scripts/restore-category-backup.ts 20260531-pre-rebuild
 */
import { readFileSync } from 'fs'
import { prisma } from '../src/lib/prisma'

const stamp = process.argv[2]
if (!stamp) {
  console.error('Usage: tsx scripts/restore-category-backup.ts <stamp>')
  process.exit(1)
}

interface CatRow {
  id: string
  slug: string
  name: string
  icon: string | null
  description: string | null
  color: string | null
  nameNeedsReview: boolean
  parentId: string | null
}

async function main() {
  const cats: CatRow[] = JSON.parse(
    readFileSync(`.tmp/db-backups/categories-${stamp}.json`, 'utf-8'),
  )
  const pairs: Array<{ id: string; categoryId: string }> = JSON.parse(
    readFileSync(`.tmp/db-backups/product-category-${stamp}.json`, 'utf-8'),
  )
  console.log(`Restoring ${cats.length} categories, ${pairs.length} product links (stamp=${stamp})`)

  const backupIds = new Set(cats.map((c) => c.id))

  // 1. Снять parentId с текущих категорий, чтобы избежать FK при пересоздании
  await prisma.category.updateMany({ data: { parentId: null } })

  // 2. Восстановить категории без parentId (upsert by id). slug может быть занят
  //    другой записью — тогда сначала освобождаем slug у конфликтующей.
  for (const c of cats) {
    const bySlug = await prisma.category.findUnique({ where: { slug: c.slug } })
    if (bySlug && bySlug.id !== c.id) {
      await prisma.category.update({ where: { id: bySlug.id }, data: { slug: `__tmp_${bySlug.id}` } })
    }
    await prisma.category.upsert({
      where: { id: c.id },
      create: {
        id: c.id,
        slug: c.slug,
        name: c.name,
        icon: c.icon,
        description: c.description,
        color: c.color,
        nameNeedsReview: c.nameNeedsReview,
        parentId: null,
      },
      update: {
        slug: c.slug,
        name: c.name,
        icon: c.icon,
        description: c.description,
        color: c.color,
        nameNeedsReview: c.nameNeedsReview,
        parentId: null,
      },
    })
  }

  // 3. Восстановить иерархию (parentId)
  for (const c of cats) {
    if (c.parentId) {
      await prisma.category.update({ where: { id: c.id }, data: { parentId: c.parentId } })
    }
  }

  // 4. Восстановить привязку товаров (группами по categoryId)
  const groups = new Map<string, string[]>()
  for (const p of pairs) {
    if (!groups.has(p.categoryId)) groups.set(p.categoryId, [])
    groups.get(p.categoryId)!.push(p.id)
  }
  let restored = 0
  for (const [categoryId, ids] of groups) {
    for (let i = 0; i < ids.length; i += 500) {
      const res = await prisma.product.updateMany({
        where: { id: { in: ids.slice(i, i + 500) } },
        data: { categoryId },
      })
      restored += res.count
    }
  }
  console.log(`Restored ${restored} product links`)

  // 5. Удалить категории, которых не было в снимке (созданные rebuild-ом)
  const del = await prisma.category.deleteMany({ where: { id: { notIn: [...backupIds] } } })
  console.log(`Deleted ${del.count} non-backup categories`)

  const after = await prisma.category.count()
  console.log(`Categories now: ${after}`)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
