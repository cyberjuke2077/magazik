'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import {
  ShoppingCart, Plus, Minus, ArrowLeft,
  Truck, Shield, Check, ChevronRight, Zap, RotateCcw,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ProductCard } from '@/components/catalog/product-card'
import { getProductBySlug, products } from '@/lib/mock-data'
import { formatPrice, formatNumber } from '@/lib/utils'
import { useCart } from '@/hooks/use-cart'

interface PageProps {
  params: Promise<{ slug: string }>
}

type Tab = 'description' | 'specs' | 'delivery'

const catIcons: Record<string, string> = {
  rezistory: '⊖', kondensatory: '⊣', mikroskhemy: '▣', tranzistory: '◁',
  rele: '⊏', datchiki: '◎', kontrollery: '⬛', diody: '▷', svetodiody: '◉', razyomy: '⊞',
}

const catStyle: Record<string, { bg: string; text: string }> = {
  rezistory:    { bg: 'bg-blue-50',    text: 'text-blue-500' },
  kondensatory: { bg: 'bg-cyan-50',    text: 'text-cyan-500' },
  mikroskhemy:  { bg: 'bg-indigo-50',  text: 'text-indigo-500' },
  tranzistory:  { bg: 'bg-violet-50',  text: 'text-violet-500' },
  rele:         { bg: 'bg-emerald-50', text: 'text-emerald-500' },
  datchiki:     { bg: 'bg-teal-50',    text: 'text-teal-500' },
  kontrollery:  { bg: 'bg-orange-50',  text: 'text-orange-500' },
  diody:        { bg: 'bg-red-50',     text: 'text-red-500' },
  svetodiody:   { bg: 'bg-yellow-50',  text: 'text-yellow-500' },
  razyomy:      { bg: 'bg-pink-50',    text: 'text-pink-500' },
}

export default function ProductPage({ params }: PageProps) {
  const { slug } = use(params)
  const product = getProductBySlug(slug)

  const [quantity, setQuantity] = useState(product?.minOrder ?? 1)
  const [addedToCart, setAddedToCart] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('description')
  const [activeThumb, setActiveThumb] = useState(0)

  const { addItem } = useCart()

  const related = products
    .filter((p) => p.categorySlug === product?.categorySlug && p.id !== product?.id)
    .slice(0, 4)

  function handleAddToCart() {
    if (!product) return
    addItem(product, quantity)
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  if (!product) {
    return (
      <>
        <Header />
        <main className="flex-1 flex items-center justify-center bg-white py-20">
          <div className="text-center">
            <div className="text-6xl mb-4 opacity-20">◆</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Товар не найден</h1>
            <p className="text-sm text-gray-500 mb-6">Возможно, он был удалён или артикул изменился</p>
            <Link href="/catalog" className="inline-flex items-center gap-2 h-10 px-5 text-sm font-semibold text-white bg-[#166534] hover:bg-[#15803d] rounded-xl transition-all">
              <ArrowLeft size={14} /> Вернуться в каталог
            </Link>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const icon = catIcons[product.categorySlug] ?? '◆'
  const cs = catStyle[product.categorySlug] ?? { bg: 'bg-gray-50', text: 'text-gray-400' }
  const discountPercent = product.priceWholesale
    ? Math.round((1 - product.priceWholesale / product.price) * 100)
    : null

  // Галерея — 4 "вида" одного компонента
  const thumbs = [icon, '◈', '◉', '◆']

  const tabs: { id: Tab; label: string }[] = [
    { id: 'description', label: 'Описание' },
    { id: 'specs',       label: 'Характеристики' },
    { id: 'delivery',    label: 'Доставка' },
  ]

  return (
    <>
      <Header />
      <main className="flex-1 bg-white">

        {/* Breadcrumb */}
        <div className="border-b border-gray-100">
          <div className="mx-auto max-w-7xl px-4 py-3">
            <nav className="flex items-center gap-1.5 text-xs text-gray-400 flex-wrap">
              <Link href="/" className="hover:text-gray-600 transition-colors">Главная</Link>
              <ChevronRight size={10} />
              <Link href="/catalog" className="hover:text-gray-600 transition-colors">Каталог</Link>
              <ChevronRight size={10} />
              <Link href={`/catalog?category=${product.categorySlug}`} className="hover:text-gray-600 transition-colors">{product.category}</Link>
              <ChevronRight size={10} />
              <span className="text-gray-700 font-medium truncate max-w-[200px]">{product.name}</span>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8">

          {/* ── Product ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

            {/* Gallery */}
            <div className="flex gap-3">
              {/* Thumbnails */}
              <div className="flex flex-col gap-2 shrink-0">
                {thumbs.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveThumb(i)}
                    className={`flex items-center justify-center size-16 rounded-xl border-2 text-xl font-mono transition-all ${
                      activeThumb === i
                        ? `border-[#166534] ${cs.bg} ${cs.text}`
                        : 'border-gray-100 bg-gray-50 text-gray-300 hover:border-gray-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Main image */}
              <div className={`flex-1 relative ${cs.bg} rounded-2xl flex items-center justify-center overflow-hidden border border-gray-100`} style={{ minHeight: 360 }}>
                {/* Grid */}
                <div className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: 'linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                  }}
                />
                <span className={`relative text-[140px] font-mono ${cs.text} opacity-30 select-none`}>
                  {thumbs[activeThumb]}
                </span>

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {product.featured && (
                    <span className="flex items-center gap-1 px-2.5 py-1 bg-[#166534] text-white text-xs font-bold rounded-full">
                      <Zap size={10} /> ХИТ продаж
                    </span>
                  )}
                  {discountPercent && (
                    <span className="px-2.5 py-1 bg-[#f97316] text-white text-xs font-bold rounded-full">
                      −{discountPercent}% оптом
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="flex flex-col">
              {/* Category + manufacturer */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                  {product.category}
                </span>
                <span className="text-sm font-bold text-[#166534]">{product.manufacturer}</span>
              </div>

              {/* Name */}
              <h1 className="text-2xl font-bold text-gray-900 leading-snug mb-2">
                {product.name}
              </h1>

              {/* Part number */}
              <div className="font-mono text-sm text-gray-400 mb-4">
                Арт: <span className="text-gray-600 font-semibold">{product.partNumber}</span>
              </div>

              {/* Stock */}
              <div className="flex items-center gap-2 mb-5 p-3 bg-gray-50 rounded-xl border border-gray-100">
                {product.inStock ? (
                  <>
                    <span className="size-2 rounded-full bg-[#166534] animate-pulse-dot shrink-0" />
                    <span className="text-sm font-semibold text-[#166534]">В наличии</span>
                    <span className="text-sm text-gray-400">· {formatNumber(product.stockCount)} {product.unit} на складе</span>
                  </>
                ) : (
                  <>
                    <span className="size-2 rounded-full bg-red-500 shrink-0" />
                    <span className="text-sm font-semibold text-red-500">Нет в наличии</span>
                  </>
                )}
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-gray-900">{formatPrice(product.price)}</span>
                  <span className="text-sm text-gray-400">/ {product.unit}</span>
                </div>
                {product.priceWholesale && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-base font-semibold text-[#f97316]">
                      Опт: {formatPrice(product.priceWholesale)}
                    </span>
                    <span className="text-xs text-gray-400">от {product.minOrder} {product.unit}</span>
                  </div>
                )}
              </div>

              {/* Quantity + Add */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(product.minOrder, quantity - 1))}
                    className="flex items-center justify-center w-11 h-12 text-gray-500 hover:bg-gray-50 hover:text-[#166534] transition-colors border-r border-gray-200"
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(product.minOrder, parseInt(e.target.value) || product.minOrder))}
                    className="w-16 text-center text-base font-bold text-gray-900 bg-transparent outline-none"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="flex items-center justify-center w-11 h-12 text-gray-500 hover:bg-gray-50 hover:text-[#166534] transition-colors border-l border-gray-200"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className={`flex-1 flex items-center justify-center gap-2 h-12 text-sm font-bold rounded-xl transition-all ${
                    addedToCart
                      ? 'bg-[#15803d] text-white'
                      : product.inStock
                      ? 'bg-[#166534] text-white hover:bg-[#15803d] active:scale-[0.98]'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {addedToCart
                    ? <><Check size={16} /> Добавлено в корзину!</>
                    : <><ShoppingCart size={16} /> В корзину · {formatPrice(product.price * quantity)}</>
                  }
                </button>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: Truck,      label: 'Отправка сегодня', sub: 'до 15:00',       color: 'text-[#166534]', bg: 'bg-[#f0fdf4]' },
                  { icon: Shield,     label: 'Оригинал',         sub: 'с сертификатом', color: 'text-[#f97316]', bg: 'bg-orange-50' },
                  { icon: RotateCcw,  label: 'Возврат',          sub: '14 дней',        color: 'text-[#166534]', bg: 'bg-[#f0fdf4]' },
                ].map((b) => (
                  <div key={b.label} className={`flex flex-col items-center gap-1 p-3 ${b.bg} rounded-xl text-center`}>
                    <b.icon size={16} className={b.color} />
                    <span className="text-xs font-semibold text-gray-700">{b.label}</span>
                    <span className="text-[10px] text-gray-400">{b.sub}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div className="border border-gray-100 rounded-2xl overflow-hidden mb-8 shadow-sm">
            <div className="flex border-b border-gray-100 bg-gray-50">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 text-sm font-semibold transition-all border-b-2 -mb-px ${
                    activeTab === tab.id
                      ? 'border-[#166534] text-[#166534] bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6 bg-white">
              {activeTab === 'description' && (
                <div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-5">{product.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag) => (
                      <span key={tag} className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'specs' && (
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  {Object.entries(product.specs).map(([key, value], i) => (
                    <div key={key} className={`flex items-center justify-between px-5 py-3.5 ${i !== 0 ? 'border-t border-gray-100' : ''} ${i % 2 !== 0 ? 'bg-gray-50' : 'bg-white'}`}>
                      <span className="text-sm text-gray-500">{key}</span>
                      <span className="text-sm font-mono font-semibold text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'delivery' && (
                <div className="space-y-3">
                  {[
                    { name: 'СДЭК',          time: '1–5 дней',       price: 'от 250 ₽',  desc: 'До пункта выдачи или курьером до двери.' },
                    { name: 'DHL Express',    time: '1–3 дня',        price: 'от 490 ₽',  desc: 'Экспресс-доставка по России и СНГ.' },
                    { name: 'Почта России',   time: '3–14 дней',      price: 'от 150 ₽',  desc: 'В любой населённый пункт России.' },
                    { name: 'Самовывоз',      time: 'В день заказа',  price: 'Бесплатно', desc: 'Москва, ул. Радиальная, 4.' },
                  ].map((d) => (
                    <div key={d.name} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <Truck size={18} className="text-[#166534] shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold text-gray-900">{d.name}</span>
                          <span className="text-sm font-bold text-[#166534]">{d.price}</span>
                        </div>
                        <div className="text-xs text-gray-400 mb-1">{d.time}</div>
                        <div className="text-xs text-gray-500">{d.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Related ── */}
          {related.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">Похожие товары</h2>
                <Link href={`/catalog?category=${product.categorySlug}`}
                  className="flex items-center gap-1 text-sm font-semibold text-[#166534] hover:underline">
                  Смотреть все <ChevronRight size={13} />
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {related.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
