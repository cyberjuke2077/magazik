'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { X, ShoppingCart, Trash2 } from 'lucide-react'
import { useCompare } from '@/hooks/use-compare'
import { clearCompare, removeFromCompare } from '@/lib/compare-store'
import { useCart } from '@/hooks/use-cart'
import { CategoryIcon } from '@/components/ui/component-icons'
import { formatPrice } from '@/lib/utils'
import { type Product } from '@/lib/queries/products'
import { fetchCompareProducts } from './actions'
import { RecentlyViewed } from '@/components/catalog/recently-viewed'

export function CompareClient() {
  const { items: compareItems, mounted } = useCompare()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [onlyDifferences, setOnlyDifferences] = useState(false)
  const { addItem } = useCart()

  useEffect(() => {
    if (!mounted) return
    if (compareItems.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProducts([])
      setLoading(false)
      return
    }
    setLoading(true)
    setLoadError(null)
    const ids = compareItems.map((i) => i.id)
    fetchCompareProducts(ids)
      .then((data) => setProducts(data))
      .catch((error: unknown) => {
        setProducts([])
        setLoadError(error instanceof Error ? error.message : 'Не удалось загрузить товары для сравнения')
      })
      .finally(() => setLoading(false))
  }, [mounted, compareItems])

  // Loading state
  if (!mounted || loading) {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-[1400px] px-4 py-10">
          <h1 className="mb-2 text-2xl font-bold text-ink">Сравнение товаров</h1>
          <div className="mt-6 grid gap-3 rounded-2xl bg-white p-5 shadow-[var(--shadow-xs)] sm:grid-cols-3">
            {[1, 2, 3].map((item) => <div key={item} className="skeleton h-[260px]" />)}
          </div>
        </div>
      </main>
    )
  }

  // Empty state
  if (loadError) {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-[1380px] px-4 py-8 lg:px-0">
          <div className="rounded-2xl bg-white px-6 py-16 text-center shadow-[var(--shadow-xs)]">
            <h1 className="text-2xl font-bold text-ink">Сравнение не загрузилось</h1>
            <p className="mx-auto mt-2 max-w-xl text-sm text-ink-3">{loadError}</p>
            <button onClick={() => window.location.reload()} className="mt-5 h-10 rounded-xl bg-azure px-5 text-sm font-bold text-white hover:bg-azure-hover">Повторить</button>
          </div>
        </div>
      </main>
    )
  }

  if (products.length === 0) {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-[1380px] px-4 pb-2 pt-6 lg:px-0">
          <div className="grid min-h-[300px] items-center rounded-2xl bg-white px-6 py-5 shadow-[var(--shadow-xs)] sm:grid-cols-[380px_minmax(0,1fr)] sm:px-10" data-motion-reveal>
            <Image
              src="/storefront/empty-compare.png"
              alt="Пустой список сравнения Electromagaz"
              width={350}
              height={230}
              className="mx-auto h-[210px] w-[350px] object-contain"
            />
            <div className="max-w-xl">
              <h1 className="mb-3 text-[24px] font-bold leading-tight text-ink">Список сравнения пуст</h1>
              <p className="mb-6 text-sm text-ink-2">
                Добавьте до четырех компонентов из каталога, чтобы сопоставить характеристики, корпуса и условия поставки.
              </p>
              <div className="flex gap-3">
                <Link
                  href="/"
                  className="inline-flex h-11 min-w-[138px] items-center justify-center rounded-lg border border-[var(--border-2)] px-5 text-sm font-semibold text-ink transition-colors hover:bg-surface-muted"
                >
                  На главную
                </Link>
                <Link
                  href="/catalog"
                  className="inline-flex h-11 min-w-[138px] items-center justify-center rounded-[var(--radius-control)] bg-azure px-5 text-sm font-bold text-white transition-colors duration-200 hover:bg-azure-hover active:translate-y-px"
                >
                  В каталог
                </Link>
              </div>
            </div>
          </div>
        </div>
        <RecentlyViewed variant="cart" />
      </main>
    )
  }

  // Build full union of all spec keys
  const allSpecKeys = Array.from(
    new Set(products.flatMap((p) => Object.keys(p.specs))),
  ).sort()

  // Filter to only differences if toggled
  const visibleSpecKeys = onlyDifferences
    ? allSpecKeys.filter((key) => {
        const values = products.map((p) => p.specs[key] || '-')
        return new Set(values).size > 1
      })
    : allSpecKeys

  function handleAddToCart(product: Product) {
    addItem(product, product.minOrder)
  }

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-[1440px] px-3 py-5 sm:px-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-ink">Сравнение товаров</h1>
          <button
            onClick={clearCompare}
            className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition-colors"
          >
            <Trash2 size={14} />
            Очистить
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          {products.length} {products.length === 1 ? 'товар' : products.length < 5 ? 'товара' : 'товаров'} в сравнении
        </p>

        {/* Controls */}
        <label className="inline-flex items-center gap-2 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={onlyDifferences}
            onChange={(e) => setOnlyDifferences(e.target.checked)}
            className="size-4 accent-azure"
          />
          <span className="text-sm text-gray-700">Показывать только различия</span>
        </label>

        {/* Comparison table */}
        <div className="overflow-x-auto rounded-2xl bg-white shadow-[var(--shadow-xs)]">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 bg-gray-50 border-b border-r border-gray-200 px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide w-[180px] min-w-[180px]">
                  Параметр
                </th>
                {products.map((p) => (
                  <th
                    key={p.id}
                    className="relative w-[230px] min-w-[230px] border-b border-r border-gray-200 px-3 py-3 text-left align-top last:border-r-0"
                  >
                    <button
                      onClick={() => removeFromCompare(p.id)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
                      aria-label="Убрать из сравнения"
                    >
                      <X size={14} />
                    </button>
                    <Link href={`/product/${p.slug}`} className="block group">
                      <div className="relative mb-3 flex h-24 items-center justify-center overflow-hidden bg-surface-muted">
                        <CategoryIcon
                          slug={p.categorySlug}
                          size={56}
                          className="text-azure opacity-60 icon-svg"
                        />
                      </div>
                      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                        {p.manufacturer}
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-azure transition-colors">
                        {p.name}
                      </h3>
                      <div className="font-mono text-[11px] text-gray-400 mt-1">{p.partNumber}</div>
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Price row */}
              <tr>
                <td className="sticky left-0 bg-gray-50 border-b border-r border-gray-200 px-4 py-3 font-semibold text-gray-700">
                  Цена
                </td>
                {products.map((p) => (
                  <td key={p.id} className="border-b border-r border-gray-200 last:border-r-0 px-4 py-3">
                    {p.price > 0 ? (
                      <div className="text-lg font-extrabold text-gray-900">
                        {formatPrice(p.price)}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">по запросу</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Stock row */}
              <tr>
                <td className="sticky left-0 bg-gray-50 border-b border-r border-gray-200 px-4 py-3 font-semibold text-gray-700">
                  Наличие
                </td>
                {products.map((p) => (
                  <td key={p.id} className="border-b border-r border-gray-200 last:border-r-0 px-4 py-3">
                    {p.inStock ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-azure">
                        <span className="size-1.5 rounded-full bg-azure" />
                        {p.stockCount.toLocaleString('ru-RU')} {p.unit}
                      </span>
                    ) : (
                      <span className="text-xs text-accent font-semibold">Под заказ</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Lifecycle */}
              {products.some((p) => p.lifecycle) && (
                <tr>
                  <td className="sticky left-0 bg-gray-50 border-b border-r border-gray-200 px-4 py-3 font-semibold text-gray-700">
                    Жизненный цикл
                  </td>
                  {products.map((p) => (
                    <td key={p.id} className="border-b border-r border-gray-200 last:border-r-0 px-4 py-3 text-xs text-gray-700">
                      {p.lifecycle || '-'}
                    </td>
                  ))}
                </tr>
              )}

              {/* Package */}
              {products.some((p) => p.package) && (
                <tr>
                  <td className="sticky left-0 bg-gray-50 border-b border-r border-gray-200 px-4 py-3 font-semibold text-gray-700">
                    Корпус
                  </td>
                  {products.map((p) => (
                    <td key={p.id} className="border-b border-r border-gray-200 last:border-r-0 px-4 py-3 text-xs text-gray-700">
                      {p.package || '-'}
                    </td>
                  ))}
                </tr>
              )}

              {/* Specs */}
              {visibleSpecKeys.length === 0 && (
                <tr>
                  <td
                    colSpan={products.length + 1}
                    className="px-4 py-6 text-center text-sm text-gray-500"
                  >
                    {onlyDifferences
                      ? 'Все характеристики совпадают'
                      : 'Нет данных по характеристикам'}
                  </td>
                </tr>
              )}
              {visibleSpecKeys.map((key) => (
                <tr key={key}>
                  <td className="sticky left-0 bg-gray-50 border-b border-r border-gray-200 px-4 py-3 text-xs text-gray-600">
                    {key}
                  </td>
                  {products.map((p) => (
                    <td
                      key={p.id}
                      className="border-b border-r border-gray-200 last:border-r-0 px-4 py-3 text-xs text-gray-800"
                    >
                      {p.specs[key] || <span className="text-gray-300">-</span>}
                    </td>
                  ))}
                </tr>
              ))}

              {/* Actions row */}
              <tr>
                <td className="sticky left-0 bg-gray-50 border-r border-gray-200 px-4 py-3" />
                {products.map((p) => (
                  <td key={p.id} className="border-r border-gray-200 last:border-r-0 px-4 py-3">
                    <button
                      onClick={() => handleAddToCart(p)}
                      disabled={!p.inStock && false}
                      className="flex h-9 w-full items-center justify-center gap-1.5 rounded-[var(--radius-control)] bg-azure text-xs font-bold text-white transition-colors duration-200 hover:bg-azure-hover active:translate-y-px"
                    >
                      <ShoppingCart size={12} />В корзину
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
