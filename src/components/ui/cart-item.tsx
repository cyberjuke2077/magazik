'use client'

import Link from 'next/link'
import { Minus, Plus, Trash2, Package } from 'lucide-react'
import { type CartItem } from '@/types'
import { formatPrice, formatNumber } from '@/lib/utils'

const categoryIcons: Record<string, string> = {
  rezistory: '⊖',
  kondensatory: '⊣',
  mikroskhemy: '▣',
  tranzistory: '◁',
  rele: '⊏',
  datchiki: '◎',
  kontrollery: '⬛',
  diody: '▷',
  svetodiody: '◉',
  razyomy: '⊞',
}

interface CartItemRowProps {
  item: CartItem
  onUpdateQuantity: (productId: string, quantity: number) => void
  onRemove: (productId: string) => void
}

export function CartItemRow({ item, onUpdateQuantity, onRemove }: CartItemRowProps) {
  const { product, quantity } = item
  const icon = categoryIcons[product.categorySlug] ?? '◆'
  const lineTotal = product.price * quantity
  const lineTotalWholesale = (product.priceWholesale ?? product.price) * quantity
  const isWholesale = product.priceWholesale !== undefined && quantity >= product.minOrder

  return (
    <div className="group flex items-start gap-4 p-4 bg-white border border-black/8 rounded-xl shadow-sm hover:shadow-md hover:border-black/12 transition-all duration-200">
      {/* Icon */}
      <Link
        href={`/product/${product.slug}`}
        className="flex items-center justify-center size-16 shrink-0 rounded-xl bg-[#fef3e8] border border-black/6 font-mono text-2xl text-[#166534] opacity-60 hover:opacity-90 transition-opacity"
      >
        {icon}
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/product/${product.slug}`}
              className="text-sm font-medium text-[#1c1917] hover:text-[#166534] transition-colors line-clamp-2 leading-snug"
            >
              {product.name}
            </Link>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-[10px] text-[#a8a29e] bg-[#fef3e8] px-1.5 py-0.5 rounded">
                {product.partNumber}
              </span>
              <span className="text-[10px] text-[#a8a29e]">{product.manufacturer}</span>
            </div>
          </div>

          {/* Remove button */}
          <button
            onClick={() => onRemove(product.id)}
            className="shrink-0 flex items-center justify-center size-7 rounded-lg text-[#a8a29e] hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
            aria-label="Удалить товар"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Stock */}
        <div className="flex items-center gap-1.5 mt-2 text-xs">
          {product.inStock ? (
            <>
              <span className="size-1.5 rounded-full bg-[#15803d]" />
              <span className="text-[#15803d]">В наличии</span>
              <span className="text-[#a8a29e]">· {formatNumber(product.stockCount)} {product.unit}</span>
            </>
          ) : (
            <>
              <span className="size-1.5 rounded-full bg-red-400" />
              <span className="text-red-500">Нет в наличии</span>
            </>
          )}
        </div>

        {/* Bottom row: quantity + price */}
        <div className="flex items-center justify-between mt-3 gap-3">
          {/* Quantity stepper */}
          <div className="flex items-center gap-1 bg-[#fef3e8] border border-black/8 rounded-lg p-0.5">
            <button
              onClick={() => onUpdateQuantity(product.id, quantity - 1)}
              disabled={quantity <= product.minOrder}
              className="flex items-center justify-center size-7 rounded-md text-[#78716c] hover:text-[#1c1917] hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              aria-label="Уменьшить"
            >
              <Minus size={12} />
            </button>
            <span className="w-10 text-center text-sm font-semibold text-[#1c1917]">
              {quantity}
            </span>
            <button
              onClick={() => onUpdateQuantity(product.id, quantity + 1)}
              className="flex items-center justify-center size-7 rounded-md text-[#78716c] hover:text-[#1c1917] hover:bg-white transition-all"
              aria-label="Увеличить"
            >
              <Plus size={12} />
            </button>
          </div>

          {/* Price */}
          <div className="text-right">
            <div className="text-base font-bold text-[#1c1917]">
              {formatPrice(isWholesale ? lineTotalWholesale : lineTotal)}
            </div>
            {isWholesale && (
              <div className="text-[10px] text-[#f97316]">оптовая цена</div>
            )}
            {!isWholesale && product.priceWholesale && (
              <div className="text-[10px] text-[#a8a29e]">
                опт от {product.minOrder} {product.unit}
              </div>
            )}
          </div>
        </div>

        {/* Min order hint */}
        {product.minOrder > 1 && (
          <div className="flex items-center gap-1 mt-1.5 text-[10px] text-[#a8a29e]">
            <Package size={9} />
            Мин. заказ: {product.minOrder} {product.unit}
          </div>
        )}
      </div>
    </div>
  )
}
