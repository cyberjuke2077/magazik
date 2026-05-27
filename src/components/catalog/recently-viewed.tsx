'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Clock, X } from 'lucide-react'
import {
  type RecentlyViewedItem,
  clearRecentlyViewed,
  getRecentlyViewed,
} from '@/lib/recently-viewed'
import { formatPrice } from '@/lib/utils'
import { CategoryIcon } from '@/components/ui/component-icons'

interface RecentlyViewedProps {
  /** Slug to exclude (e.g., the current product page) */
  excludeSlug?: string
  /** Visual variant for layout adaptation */
  variant?: 'home' | 'product'
}

export function RecentlyViewed({ excludeSlug, variant = 'home' }: RecentlyViewedProps) {
  const [items, setItems] = useState<RecentlyViewedItem[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const list = getRecentlyViewed().filter((i) => i.slug !== excludeSlug)
    setItems(list)
  }, [excludeSlug])

  function handleClear() {
    clearRecentlyViewed()
    setItems([])
  }

  if (!mounted || items.length === 0) return null

  const displayItems = variant === 'product' ? items.slice(0, 4) : items.slice(0, 6)

  return (
    <section className={variant === 'home' ? 'py-10 bg-white' : 'py-8'}>
      <div className={variant === 'home' ? 'mx-auto max-w-[1400px] px-4' : ''}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-[#0066cc]" />
            <h2 className="text-base font-bold text-gray-900">Недавно просмотренные</h2>
            <span className="text-xs text-gray-400">({items.length})</span>
          </div>
          <button
            onClick={handleClear}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            <X size={11} />
            Очистить
          </button>
        </div>

        <div
          className={`grid gap-3 ${
            variant === 'product'
              ? 'grid-cols-2 sm:grid-cols-4'
              : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
          }`}
        >
          {displayItems.map((p) => (
            <Link
              key={p.slug}
              href={`/product/${p.slug}`}
              className="group flex flex-col bg-white border border-gray-200 rounded overflow-hidden hover:border-[#0066cc] transition-colors"
            >
              <div className="relative bg-[#e8f4ff] h-[120px] flex items-center justify-center overflow-hidden">
                <div className="icon-svg">
                  <CategoryIcon
                    slug={p.categorySlug}
                    size={48}
                    className="text-[#0066cc] opacity-60"
                  />
                </div>
              </div>
              <div className="p-3 flex flex-col gap-1">
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide truncate">
                  {p.manufacturer}
                </div>
                <div className="text-xs font-semibold text-gray-800 line-clamp-2 leading-tight min-h-[32px]">
                  {p.name}
                </div>
                <div className="font-mono text-[10px] text-gray-400 truncate">{p.partNumber}</div>
                {p.price > 0 && (
                  <div className="text-sm font-bold text-gray-900 mt-1">
                    {formatPrice(p.price)}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
