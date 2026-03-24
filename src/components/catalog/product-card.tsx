'use client'

import Link from 'next/link'
import { ShoppingCart, Package, Zap, Check } from 'lucide-react'
import { useState } from 'react'
import { type Product } from '@/types'
import { formatPrice, formatNumber } from '@/lib/utils'
import { useCart } from '@/hooks/use-cart'

interface ProductCardProps {
  product: Product
}

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

export function ProductCard({ product }: ProductCardProps) {
  const icon = categoryIcons[product.categorySlug] ?? '◆'
  const discountPercent = product.priceWholesale
    ? Math.round((1 - product.priceWholesale / product.price) * 100)
    : null

  const { addItem, isInCart } = useCart()
  const [justAdded, setJustAdded] = useState(false)
  const inCart = isInCart(product.id)

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    addItem(product, product.minOrder)
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 1500)
  }

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group relative flex flex-col bg-white border border-black/8 rounded-xl overflow-hidden card-hover shadow-sm"
    >
      {/* Image / Icon area */}
      <div className="relative aspect-square bg-[#fef3e8] flex items-center justify-center overflow-hidden">
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(rgba(22,101,52,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(22,101,52,0.04) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        {/* Category icon */}
        <div className="relative flex items-center justify-center size-20 rounded-2xl bg-white border border-black/8 text-4xl font-mono text-[#166534] opacity-50 group-hover:opacity-90 group-hover:scale-110 transition-all duration-300 shadow-sm">
          {icon}
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-[#166534]/0 group-hover:bg-[#166534]/3 transition-colors duration-300" />

        {/* Featured badge */}
        {product.featured && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 bg-[#166534]/10 border border-[#166534]/20 rounded text-[10px] font-medium text-[#166534]">
            <Zap size={9} />
            ТОП
          </div>
        )}

        {/* Wholesale badge */}
        {discountPercent && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-[#f97316]/10 border border-[#f97316]/20 rounded text-[10px] font-medium text-[#f97316]">
            -{discountPercent}% опт
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-3 gap-2">
        {/* Part number */}
        <div className="font-mono text-[10px] text-[#a8a29e] tracking-wide">{product.partNumber}</div>

        {/* Name */}
        <h3 className="text-sm text-[#1c1917] leading-snug line-clamp-2 group-hover:text-[#166534] transition-colors">
          {product.name}
        </h3>

        {/* Manufacturer */}
        <div className="text-xs text-[#78716c]">{product.manufacturer}</div>

        {/* Stock status */}
        <div className="flex items-center gap-1.5 text-xs">
          {product.inStock ? (
            <>
              <span className="size-1.5 rounded-full bg-[#15803d] animate-pulse-dot" />
              <span className="text-[#15803d]">В наличии</span>
              <span className="text-[#a8a29e]">· {formatNumber(product.stockCount)} {product.unit}</span>
            </>
          ) : (
            <>
              <span className="size-1.5 rounded-full bg-red-500" />
              <span className="text-red-500">Нет в наличии</span>
            </>
          )}
        </div>

        {/* Pricing */}
        <div className="mt-auto pt-2 border-t border-black/6">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-base font-bold text-[#1c1917]">
                {formatPrice(product.price)}
                <span className="text-xs font-normal text-[#a8a29e] ml-1">/ {product.unit}</span>
              </div>
              {product.priceWholesale && (
                <div className="text-xs text-[#f97316]">
                  Опт: {formatPrice(product.priceWholesale)}
                </div>
              )}
            </div>

            {/* Add to cart */}
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className={`flex items-center justify-center size-8 rounded-lg transition-all duration-200 shadow-sm
                opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0
                ${justAdded || inCart
                  ? 'bg-[#15803d] text-white scale-110'
                  : 'bg-[#166534] text-white hover:bg-[#15803d] active:scale-95'
                }
                disabled:bg-black/10 disabled:text-[#a8a29e] disabled:cursor-not-allowed disabled:shadow-none
              `}
              aria-label="Добавить в корзину"
            >
              {justAdded || inCart ? <Check size={13} /> : <ShoppingCart size={14} />}
            </button>
          </div>

          {/* Min order */}
          {product.minOrder > 1 && (
            <div className="flex items-center gap-1 mt-1 text-[10px] text-[#a8a29e]">
              <Package size={9} />
              Мин. заказ: {product.minOrder} {product.unit}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
