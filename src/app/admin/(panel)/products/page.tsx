import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ProductPricingRow, type PricingRowProduct } from './pricing-row'
import { SearchBox } from './search-box'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

const FILTERS = [
  { value: '', label: 'Все' },
  { value: 'unpriced', label: 'Без цены' },
  { value: 'priced', label: 'С ценой' },
] as const

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string; page?: string }>
}) {
  const { q = '', filter = '', page: pageRaw } = await searchParams
  const page = Math.max(1, parseInt(pageRaw ?? '1', 10) || 1)

  const where = {
    ...(q
      ? {
          OR: [
            { partNumber: { contains: q, mode: 'insensitive' as const } },
            { name: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(filter === 'unpriced' ? { price: null } : {}),
    ...(filter === 'priced' ? { price: { not: null } } : {}),
  }

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { partNumber: 'asc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        manufacturer: { select: { name: true } },
        category: { select: { name: true } },
      },
    }),
  ])
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const rows: PricingRowProduct[] = products.map((p) => ({
    id: p.id,
    partNumber: p.partNumber,
    name: p.name,
    manufacturer: p.manufacturer.name,
    category: p.category.name,
    price: p.price?.toString() ?? null,
    priceWholesale: p.priceWholesale?.toString() ?? null,
    stockCount: p.stockCount,
    inStock: p.inStock,
  }))

  const buildUrl = (overrides: Record<string, string | number>) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (filter) params.set('filter', filter)
    for (const [k, v] of Object.entries(overrides)) {
      if (v === '' || v === undefined) params.delete(k)
      else params.set(k, String(v))
    }
    const s = params.toString()
    return s ? `/admin/products?${s}` : '/admin/products'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold text-gray-900">Товары и цены</h1>
        <span className="text-sm text-gray-500">{total.toLocaleString('ru-RU')} товаров</span>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <SearchBox initialQuery={q} filter={filter} />
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <Link
              key={f.value}
              href={buildUrl({ filter: f.value, page: '' })}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                filter === f.value
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-gray-500 bg-white border border-gray-200 rounded-xl p-8 text-center">
          Ничего не найдено
        </p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                <th className="px-4 py-3 font-medium">Товар</th>
                <th className="px-3 py-3 font-medium">Цена, ₽</th>
                <th className="px-3 py-3 font-medium">Опт, ₽</th>
                <th className="px-3 py-3 font-medium">Остаток</th>
                <th className="px-3 py-3 font-medium text-center">Наличие</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((p) => (
                <ProductPricingRow key={p.id} product={p} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          {page > 1 && (
            <Link href={buildUrl({ page: page - 1 })} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
              ← Назад
            </Link>
          )}
          <span className="text-gray-500 px-2">
            {page} / {pages}
          </span>
          {page < pages && (
            <Link href={buildUrl({ page: page + 1 })} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
              Вперёд →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
