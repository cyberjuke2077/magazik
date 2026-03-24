'use client'

import Link from 'next/link'
import { ShoppingCart, Package, Zap } from 'lucide-react'
import { type Product } from '@/types'
import { formatPrice, formatNumber } from '@/lib/utils'

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

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group relative flex flex-col bg-[#0d0f1e] border border-white/6 rounded-xl overflow-hidden card-hover"
    >
      {/* Image / Icon area */}
      <div className="relative aspect-square bg-gradient-to-br from-[#111427] to-[#0d0f1e] flex items-center justify-center overflow-hidden">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(rgba(34,211,238,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.05) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        {/* Category icon */}
        <div className="relative flex items-center justify-center size-20 rounded-2xl bg-[#0d0f1e] border border-white/8 text-4xl font-mono text-[#22d3ee] opacity-60 group-hover:opacity-90 group-hover:scale-110 transition-all duration-300">
          {icon}
        </div>

        {/* Glow on hover */}
        <div className="absolute inset-0 bg-[#22d3ee]/0 group-hover:bg-[#22d3ee]/3 transition-colors duration-300" />

        {/* Featured badge */}
        {product.featured && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 bg-[#22d3ee]/15 border border-[#22d3ee]/25 rounded text-[10px] font-medium text-[#22d3ee]">
            <Zap size={9} />
            ТОП
          </div>
        )}

        {/* Wholesale badge */}
        {discountPercent && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-[#34d399]/15 border border-[#34d399]/25 rounded text-[10px] font-medium text-[#34d399]">
            -{discountPercent}% опт
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-3 gap-2">
        {/* Part number */}
        <div className="font-mono text-[10px] text-[#64748b] tracking-wide">{product.partNumber}</div>

        {/* Name */}
        <h3 className="text-sm text-[#f1f5f9] leading-snug line-clamp-2 group-hover:text-white transition-colors">
          {product.name}
        </h3>

        {/* Manufacturer */}
        <div className="text-xs text-[#64748b]">{product.manufacturer}</div>

        {/* Stock status */}
        <div className="flex items-center gap-1.5 text-xs">
          {product.inStock ? (
            <>
              <span className="size-1.5 rounded-full bg-[#34d399] animate-pulse-dot" />
              <span className="text-[#34d399]">В наличии</span>
              <span className="text-[#64748b]">· {formatNumber(product.stockCount)} {product.unit}</span>
            </>
          ) : (
            <>
              <span className="size-1.5 rounded-full bg-[#f87171]" />
              <span className="text-[#f87171]">Нет в наличии</span>
            </>
          )}
        </div>

        {/* Pricing */}
        <div className="mt-auto pt-2 border-t border-white/5">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-base font-bold text-[#f1f5f9]">
                {formatPrice(product.price)}
                <span className="text-xs font-normal text-[#64748b] ml-1">/ {product.unit}</span>
              </div>
              {product.priceWholesale && (
                <div className="text-xs text-[#34d399]">
                  Опт: {formatPrice(product.priceWholesale)}
                </div>
              )}
            </div>

            {/* Add to cart */}
            <button
              onClick={(e) => {
                e.preventDefault()
              }}
              className="flex items-center justify-center size-8 rounded-lg bg-[#22d3ee]/10 border border-[#22d3ee]/20 text-[#22d3ee] hover:bg-[#22d3ee]/20 hover:border-[#22d3ee]/40 active:scale-95 transition-all opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 duration-200"
              aria-label="Добавить в корзину"
            >
              <ShoppingCart size={14} />
            </button>
          </div>

          {/* Min order */}
          {product.minOrder > 1 && (
            <div className="flex items-center gap-1 mt-1 text-[10px] text-[#64748b]">
              <Package size={9} />
              Мин. заказ: {product.minOrder} {product.unit}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
