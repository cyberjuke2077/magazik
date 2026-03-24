'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import {
  ShoppingCart,
  Plus,
  Minus,
  ArrowLeft,
  Package,
  Truck,
  Shield,
  Zap,
  Copy,
  Check,
  ChevronRight,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ProductCard } from '@/components/catalog/product-card'
import { getProductBySlug, products } from '@/lib/mock-data'
import { formatPrice, formatNumber } from '@/lib/utils'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default function ProductPage({ params }: PageProps) {
  const { slug } = use(params)
  const product = getProductBySlug(slug)

  const [quantity, setQuantity] = useState(product?.minOrder ?? 1)
  const [copied, setCopied] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)

  const related = products
    .filter((p) => p.categorySlug === product?.categorySlug && p.id !== product?.id)
    .slice(0, 4)

  function handleCopy() {
    if (!product) return
    navigator.clipboard.writeText(product.partNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleAddToCart() {
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  if (!product) {
    return (
      <>
        <Header />
        <main className="flex-1 flex items-center justify-center bg-[#07080f] py-20">
          <div className="text-center">
            <div className="text-6xl mb-4 opacity-20">◆</div>
            <h1 className="text-xl font-bold text-[#f1f5f9] mb-2">Товар не найден</h1>
            <p className="text-sm text-[#64748b] mb-6">Возможно, он был удалён или артикул изменился</p>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 h-10 px-5 text-sm font-medium text-[#07080f] bg-[#22d3ee] rounded-xl transition-all btn-primary"
            >
              <ArrowLeft size={14} />
              Вернуться в каталог
            </Link>
          </div>
        </main>
        <Footer />
      </>
    )
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

  const icon = categoryIcons[product.categorySlug] ?? '◆'
  const discountPercent = product.priceWholesale
    ? Math.round((1 - product.priceWholesale / product.price) * 100)
    : null

  return (
    <>
      <Header />

      <main className="flex-1 bg-[#07080f]">
        {/* Breadcrumb */}
        <div className="border-b border-white/5 bg-[#07080f]">
          <div className="mx-auto max-w-7xl px-4 py-3">
            <nav className="flex items-center gap-1.5 text-xs text-[#64748b]">
              <Link href="/" className="hover:text-[#94a3b8] transition-colors">Главная</Link>
              <ChevronRight size={10} />
              <Link href="/catalog" className="hover:text-[#94a3b8] transition-colors">Каталог</Link>
              <ChevronRight size={10} />
              <Link
                href={`/catalog?category=${product.categorySlug}`}
                className="hover:text-[#94a3b8] transition-colors"
              >
                {product.category}
              </Link>
              <ChevronRight size={10} />
              <span className="text-[#94a3b8] truncate max-w-[200px]">{product.name}</span>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8">
          {/* Back */}
          <Link
            href="/catalog"
            className="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#94a3b8] mb-6 transition-colors"
          >
            <ArrowLeft size={14} />
            Назад в каталог
          </Link>

          {/* Product detail */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Image */}
            <div className="relative aspect-square rounded-2xl bg-gradient-to-br from-[#111427] to-[#0d0f1e] border border-white/6 flex items-center justify-center overflow-hidden">
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(34,211,238,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.05) 1px, transparent 1px)',
                  backgroundSize: '30px 30px',
                }}
              />
              <div className="relative text-8xl font-mono text-[#22d3ee] opacity-40">
                {icon}
              </div>
              {/* Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#22d3ee]/5 to-transparent" />

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.featured && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-[#22d3ee]/15 border border-[#22d3ee]/25 rounded-lg text-xs font-medium text-[#22d3ee]">
                    <Zap size={10} />
                    ТОП продаж
                  </span>
                )}
                {discountPercent && (
                  <span className="px-2 py-1 bg-[#34d399]/15 border border-[#34d399]/25 rounded-lg text-xs font-medium text-[#34d399]">
                    -{discountPercent}% оптом
                  </span>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex flex-col gap-5">
              {/* Header */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="text-xs text-[#64748b] bg-[#0d0f1e] border border-white/6 px-2 py-1 rounded-lg">
                    {product.category}
                  </span>
                  <span className="text-xs text-[#64748b]">{product.manufacturer}</span>
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-[#f1f5f9] leading-snug mb-2">
                  {product.name}
                </h1>
                {/* Part number */}
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-[#22d3ee] bg-[#22d3ee]/8 border border-[#22d3ee]/15 px-2.5 py-1 rounded-lg">
                    {product.partNumber}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-xs text-[#64748b] hover:text-[#94a3b8] transition-colors"
                    aria-label="Скопировать артикул"
                  >
                    {copied ? <Check size={13} className="text-[#34d399]" /> : <Copy size={13} />}
                    {copied ? 'Скопировано' : 'Копировать'}
                  </button>
                </div>
              </div>

              {/* Stock */}
              <div className="flex items-center gap-3 p-3 bg-[#0d0f1e] border border-white/6 rounded-xl">
                {product.inStock ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-[#34d399] animate-pulse-dot" />
                      <span className="text-sm font-medium text-[#34d399]">В наличии</span>
                    </div>
                    <span className="text-[#64748b] text-sm">
                      {formatNumber(product.stockCount)} {product.unit} на складе
                    </span>
                  </>
                ) : (
                  <>
                    <span className="size-2 rounded-full bg-[#f87171]" />
                    <span className="text-sm font-medium text-[#f87171]">Нет в наличии</span>
                  </>
                )}
              </div>

              {/* Pricing */}
              <div className="p-4 bg-[#0d0f1e] border border-white/6 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#64748b]">Розничная цена</span>
                  <span className="text-2xl font-bold text-[#f1f5f9]">
                    {formatPrice(product.price)}
                    <span className="text-sm font-normal text-[#64748b] ml-1">/ {product.unit}</span>
                  </span>
                </div>
                {product.priceWholesale && (
                  <div className="flex items-center justify-between border-t border-white/5 pt-3">
                    <span className="text-sm text-[#64748b]">
                      Оптом (от {product.minOrder} {product.unit})
                    </span>
                    <span className="text-lg font-semibold text-[#34d399]">
                      {formatPrice(product.priceWholesale)}
                      <span className="text-xs font-normal text-[#64748b] ml-1">/ {product.unit}</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Quantity + Add */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-[#0d0f1e] border border-white/8 rounded-xl p-1">
                  <button
                    onClick={() => setQuantity(Math.max(product.minOrder, quantity - 1))}
                    className="flex items-center justify-center size-9 rounded-lg text-[#64748b] hover:text-[#f1f5f9] hover:bg-white/5 transition-all"
                    aria-label="Уменьшить"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(product.minOrder, parseInt(e.target.value) || product.minOrder))
                    }
                    className="w-16 text-center text-sm font-medium text-[#f1f5f9] bg-transparent outline-none"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="flex items-center justify-center size-9 rounded-lg text-[#64748b] hover:text-[#f1f5f9] hover:bg-white/5 transition-all"
                    aria-label="Увеличить"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className={`flex-1 flex items-center justify-center gap-2 h-11 text-sm font-semibold rounded-xl transition-all btn-primary ${
                    addedToCart
                      ? 'bg-[#34d399] text-[#07080f]'
                      : product.inStock
                      ? 'bg-[#22d3ee] text-[#07080f] hover:bg-[#22d3ee]/90'
                      : 'bg-white/5 text-[#64748b] cursor-not-allowed'
                  }`}
                >
                  {addedToCart ? (
                    <>
                      <Check size={15} />
                      Добавлено!
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={15} />
                      В корзину · {formatPrice(product.price * quantity)}
                    </>
                  )}
                </button>
              </div>

              {product.minOrder > 1 && (
                <p className="flex items-center gap-1.5 text-xs text-[#64748b]">
                  <Package size={11} />
                  Минимальный заказ: {product.minOrder} {product.unit}
                </p>
              )}

              {/* Delivery info */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 p-3 bg-[#0d0f1e] border border-white/5 rounded-xl">
                  <Truck size={14} className="text-[#22d3ee] shrink-0" />
                  <span className="text-xs text-[#64748b]">Отправка сегодня до 15:00</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-[#0d0f1e] border border-white/5 rounded-xl">
                  <Shield size={14} className="text-[#818cf8] shrink-0" />
                  <span className="text-xs text-[#64748b]">Оригинальный компонент</span>
                </div>
              </div>
            </div>
          </div>

          {/* Specs */}
          <div className="mb-12">
            <h2 className="text-base font-bold text-[#f1f5f9] mb-4">Технические характеристики</h2>
            <div className="bg-[#0d0f1e] border border-white/6 rounded-2xl overflow-hidden">
              {Object.entries(product.specs).map(([key, value], i) => (
                <div
                  key={key}
                  className={`flex items-start justify-between gap-4 px-5 py-3 ${
                    i !== 0 ? 'border-t border-white/5' : ''
                  } ${i % 2 === 0 ? '' : 'bg-white/1'}`}
                >
                  <span className="text-sm text-[#64748b] shrink-0">{key}</span>
                  <span className="text-sm text-[#f1f5f9] text-right font-mono">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="mb-12">
            <h2 className="text-base font-bold text-[#f1f5f9] mb-4">Описание</h2>
            <div className="bg-[#0d0f1e] border border-white/6 rounded-2xl p-5">
              <p className="text-sm text-[#94a3b8] leading-relaxed">{product.description}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 text-xs text-[#64748b] bg-[#111427] border border-white/6 rounded-lg"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Related products */}
          {related.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-[#f1f5f9] mb-4">
                Похожие товары · {product.category}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {related.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  )
}
