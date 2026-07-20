'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { GitCompareArrows, X, ShoppingCart, Trash2, Package } from 'lucide-react'
import { useCompare } from '@/hooks/use-compare'
import { clearCompare, removeFromCompare } from '@/lib/compare-store'
import { useCart } from '@/hooks/use-cart'
import { CategoryIcon } from '@/components/ui/component-icons'
import { formatPrice } from '@/lib/utils'
import { type Product } from '@/lib/queries/products'
import { fetchCompareProducts } from './actions'

export function CompareClient() {
  const { items: compareItems, mounted } = useCompare()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
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
    const ids = compareItems.map((i) => i.id)
    fetchCompareProducts(ids)
      .then((data) => setProducts(data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [mounted, compareItems])

  // Loading state
  if (!mounted || loading) {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-[1400px] px-4 py-10">
          <h1 className="mb-2 text-2xl font-bold text-ink">Сравнение товаров</h1>
          <div className="py-20 flex items-center justify-center text-gray-400">
            Загрузка...
          </div>
        </div>
      </main>
    )
  }

  // Empty state
  if (products.length === 0) {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-[1440px] px-3 py-6 sm:px-6">
          <h1 className="mb-1 text-2xl font-bold text-ink">Сравнение товаров</h1>
          <p className="text-sm text-gray-500 mb-8">Сравнивайте характеристики компонентов бок о бок</p>

          <div className="flex flex-col items-center justify-center border border-gray-200 bg-white px-4 py-14 text-center">
            <GitCompareArrows size={40} className="mb-4 text-gray-300" />
            <h2 className="text-lg font-bold text-gray-900 mb-2">Список сравнения пуст</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-md">
              Добавляйте товары из каталога - на каждой карточке есть иконка сравнения.
              Максимум 4 товара за раз.
            </p>
            <Link
              href="/catalog"
              className="inline-flex h-10 items-center gap-2 rounded bg-accent px-6 text-sm font-bold text-white transition-colors hover:bg-accent-hover"
            >
              <Package size={14} />
              Перейти в каталог
            </Link>
          </div>
        </div>
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
        <div className="overflow-x-auto border border-gray-200 bg-white shadow-[var(--shadow-xs)]">
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
                        <span className="size-1.5 rounded-full bg-azure animate-pulse-dot" />
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
                      className="flex h-9 w-full items-center justify-center gap-1.5 rounded bg-accent text-xs font-bold text-white transition-colors hover:bg-accent-hover"
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
