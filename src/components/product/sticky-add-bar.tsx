'use client'

import { useEffect, useRef, useState } from 'react'
import { ShoppingCart, Plus, Minus } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

interface StickyAddBarProps {
  productName: string
  partNumber: string
  manufacturer: string
  price: number
  unit: string
  minOrder: number
  inStock: boolean
  quantity: number
  onQuantityChange: (n: number) => void
  onAddToCart: () => void
  /** ID of the main add-to-cart block to track visibility */
  triggerSelector?: string
}

/**
 * Sticky add-to-cart bar that appears at the bottom of the screen when the
 * main add-to-cart block scrolls out of view.
 */
export function StickyAddBar({
  productName,
  partNumber,
  manufacturer,
  price,
  unit,
  minOrder,
  inStock,
  quantity,
  onQuantityChange,
  onAddToCart,
  triggerSelector = '[data-add-to-cart-block]',
}: StickyAddBarProps) {
  const [visible, setVisible] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const target = document.querySelector(triggerSelector)
    if (!target) return

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        // Show sticky bar when main block is OUT of viewport (below it)
        setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0)
      },
      { threshold: 0, rootMargin: '0px 0px -100px 0px' },
    )
    observerRef.current.observe(target)

    return () => {
      observerRef.current?.disconnect()
    }
  }, [triggerSelector])

  return (
    <div
      className={`fixed bottom-16 left-0 right-0 z-[var(--layer-sticky)] border-t border-[var(--border)] bg-white shadow-[0_-6px_18px_rgba(32,33,36,0.08)] transition-transform duration-200 lg:bottom-0 ${
        visible ? 'translate-y-0' : 'translate-y-0 lg:translate-y-full'
      }`}
    >
      <div className="mx-auto max-w-[1440px] px-3 py-2 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Product info */}
          <div className="hidden min-w-0 flex-1 sm:block">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-4">
              {manufacturer}
            </div>
            <div className="text-sm font-bold text-ink truncate">{productName}</div>
            <div className="font-mono text-[10px] text-ink-4">{partNumber}</div>
          </div>

          {/* Price */}
          <div className="min-w-0 flex-1 text-left sm:flex-none sm:text-right">
            {price > 0 ? (
              <>
                <div className="price text-lg leading-none">
                  {formatPrice(price)}
                </div>
                <div className="text-[10px] text-ink-4 mt-0.5">/ {unit}</div>
              </>
            ) : (
              <span className="text-xs font-semibold text-azure">уточнить цену</span>
            )}
          </div>

          {/* Quantity */}
          <div className="shrink-0 flex items-center bg-[#f8fafc] border border-[var(--border)] rounded overflow-hidden">
            <button
              onClick={() => onQuantityChange(Math.max(minOrder, quantity - 1))}
              disabled={quantity <= minOrder}
              className="flex items-center justify-center w-8 h-9 text-ink-3 hover:bg-gray-100 disabled:opacity-25 disabled:cursor-not-allowed"
              aria-label="Уменьшить"
            >
              <Minus size={12} />
            </button>
            <span className="w-10 text-center text-sm font-bold text-ink border-x border-[var(--border)] select-none">
              {quantity}
            </span>
            <button
              onClick={() => onQuantityChange(quantity + 1)}
              className="flex items-center justify-center w-8 h-9 text-ink-3 hover:bg-gray-100"
              aria-label="Увеличить"
            >
              <Plus size={12} />
            </button>
          </div>

          {/* Add */}
          <button
            onClick={onAddToCart}
            disabled={!inStock && false}
            className="flex h-10 shrink-0 items-center gap-1.5 rounded-[var(--radius-control)] bg-azure px-4 text-xs font-bold text-white transition-colors hover:bg-azure-hover active:translate-y-px sm:px-6 sm:text-sm"
          >
            <ShoppingCart size={14} />
            <span>В корзину</span>
          </button>
        </div>
      </div>
    </div>
  )
}
