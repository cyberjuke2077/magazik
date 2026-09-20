'use client'

import Link from 'next/link'
import { type ReactNode, useEffect, useState } from 'react'
import { Clock, X } from 'lucide-react'
import {
  type RecentlyViewedItem,
  clearRecentlyViewed,
  getRecentlyViewed,
} from '@/lib/recently-viewed'
import { formatPrice } from '@/lib/utils'
import { CategoryIcon } from '@/components/ui/component-icons'
import { HorizontalShelf } from '@/components/ui/horizontal-shelf'

interface RecentlyViewedProps {
  /** Slug to exclude (e.g., the current product page) */
  excludeSlug?: string
  /** Visual variant for layout adaptation */
  variant?: 'home' | 'product' | 'cart'
}

export function RecentlyViewed({ excludeSlug, variant = 'home' }: RecentlyViewedProps) {
  const [items, setItems] = useState<RecentlyViewedItem[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // hydration from localStorage — required after mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    <section className={variant === 'home' ? 'bg-white py-6 lg:py-7' : variant === 'cart' ? 'bg-white py-6' : 'py-8'}>
      <div className={variant === 'home' ? 'mx-auto max-w-[1380px] px-4 lg:px-0' : variant === 'cart' ? 'mx-auto max-w-[1380px]' : ''}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-azure" />
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

        <ViewedShelf variant={variant}>
          {displayItems.map((p) => (
            <Link
              key={p.slug}
              href={`/product/${p.slug}`}
              className={`group flex bg-white border border-gray-200 overflow-hidden hover:border-azure transition-colors ${variant === 'home' ? 'flex-row items-center rounded-xl' : 'flex-col rounded'}`}
            >
              <div className={`relative flex shrink-0 items-center justify-center overflow-hidden ${variant === 'home' ? 'h-20 w-20 bg-white' : 'bg-azure-light h-[120px]'}`}>
                <div className="icon-svg">
                  <CategoryIcon
                    slug={p.categorySlug}
                    size={48}
                    className="text-azure opacity-60"
                  />
                </div>
              </div>
              <div className="min-w-0 p-3 flex flex-col gap-1">
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
        </ViewedShelf>
      </div>
    </section>
  )
}

function ViewedShelf({ variant, children }: {
  variant: RecentlyViewedProps['variant']
  children: ReactNode
}) {
  if (variant === 'home') return (
    <HorizontalShelf label="Недавно просмотренные" className="grid auto-cols-[280px] grid-flow-col gap-3 py-1 lg:auto-cols-[calc((100%-36px)/4)]">
      {children}
    </HorizontalShelf>
  )
  return (
    <div className={`grid gap-3 ${variant === 'product'
      ? 'grid-cols-2 sm:grid-cols-4'
      : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'}`}>
      {children}
    </div>
  )
}
