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
      className={`fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-gray-200 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] transition-transform duration-300 ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
      aria-hidden={!visible}
    >
      <div className="mx-auto max-w-[1400px] px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Product info */}
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
              {manufacturer}
            </div>
            <div className="text-sm font-bold text-gray-900 truncate">{productName}</div>
            <div className="font-mono text-[10px] text-gray-400">{partNumber}</div>
          </div>

          {/* Price */}
          <div className="hidden sm:block shrink-0 text-right">
            {price > 0 ? (
              <>
                <div className="text-lg font-extrabold text-gray-900 leading-none">
                  {formatPrice(price)}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">/ {unit}</div>
              </>
            ) : (
              <span className="text-xs text-gray-400">по запросу</span>
            )}
          </div>

          {/* Quantity */}
          <div className="shrink-0 flex items-center bg-gray-50 border border-gray-200 rounded overflow-hidden">
            <button
              onClick={() => onQuantityChange(Math.max(minOrder, quantity - 1))}
              disabled={quantity <= minOrder}
              className="flex items-center justify-center w-8 h-9 text-gray-500 hover:bg-gray-100 disabled:opacity-25 disabled:cursor-not-allowed"
              aria-label="Уменьшить"
            >
              <Minus size={12} />
            </button>
            <span className="w-10 text-center text-sm font-bold text-gray-900 border-x border-gray-200 select-none">
              {quantity}
            </span>
            <button
              onClick={() => onQuantityChange(quantity + 1)}
              className="flex items-center justify-center w-8 h-9 text-gray-500 hover:bg-gray-100"
              aria-label="Увеличить"
            >
              <Plus size={12} />
            </button>
          </div>

          {/* Add */}
          <button
            onClick={onAddToCart}
            disabled={!inStock && false}
            className="shrink-0 flex items-center gap-1.5 h-9 px-4 sm:px-6 text-xs sm:text-sm font-bold text-white bg-[#0066cc] hover:bg-[#0052a3] rounded transition-all"
          >
            <ShoppingCart size={14} />
            <span className="hidden sm:inline">В корзину</span>
          </button>
        </div>
      </div>
    </div>
  )
}
