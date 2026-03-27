'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  Truck, Shield, Headphones, TrendingUp,
  ArrowRight, ChevronLeft, ChevronRight, Zap,
  Users, Package, Star, Clock,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ProductCard } from '@/components/catalog/product-card'
import { CategoryIcon } from '@/components/ui/component-icons'
import { categories, products, featuredProducts } from '@/lib/mock-data'
import { formatNumber } from '@/lib/utils'

/* ── Category themes ── */
const catTheme: Record<string, { bg: string; text: string; hover: string; border: string }> = {
  rezistory:    { bg: 'bg-blue-50',    text: 'text-blue-600',    hover: 'hover:bg-blue-100',    border: 'border-blue-100' },
  kondensatory: { bg: 'bg-cyan-50',    text: 'text-cyan-600',    hover: 'hover:bg-cyan-100',    border: 'border-cyan-100' },
  mikroskhemy:  { bg: 'bg-indigo-50',  text: 'text-indigo-600',  hover: 'hover:bg-indigo-100',  border: 'border-indigo-100' },
  tranzistory:  { bg: 'bg-violet-50',  text: 'text-violet-600',  hover: 'hover:bg-violet-100',  border: 'border-violet-100' },
  rele:         { bg: 'bg-emerald-50', text: 'text-emerald-600', hover: 'hover:bg-emerald-100', border: 'border-emerald-100' },
  datchiki:     { bg: 'bg-teal-50',    text: 'text-teal-600',    hover: 'hover:bg-teal-100',    border: 'border-teal-100' },
  kontrollery:  { bg: 'bg-orange-50',  text: 'text-orange-600',  hover: 'hover:bg-orange-100',  border: 'border-orange-100' },
  diody:        { bg: 'bg-red-50',     text: 'text-red-600',     hover: 'hover:bg-red-100',     border: 'border-red-100' },
  svetodiody:   { bg: 'bg-yellow-50',  text: 'text-yellow-600',  hover: 'hover:bg-yellow-100',  border: 'border-yellow-100' },
  razyomy:      { bg: 'bg-pink-50',    text: 'text-pink-600',    hover: 'hover:bg-pink-100',    border: 'border-pink-100' },
}

/* ── Slides ── */
const slides = [
  {
    tag: 'Новинки',
    title: 'Микроконтроллеры\nSTM32 и ESP32',
    desc: 'ARM Cortex-M, WiFi, Bluetooth — всё в наличии. Отправка в день заказа.',
    cta: 'Смотреть',
    href: '/catalog?category=kontrollery',
    gradient: 'from-[#0a1f10] via-[#0f2d1a] to-[#0a1f10]',
    accentColor: '#4ade80',
    slug: 'kontrollery',
  },
  {
    tag: 'Популярное',
    title: 'Пассивные\nкомпоненты оптом',
    desc: 'Резисторы, конденсаторы Yageo и Murata. Скидки до 40% от 100 шт.',
    cta: 'Узнать цены',
    href: '/wholesale',
    gradient: 'from-[#0f0f1a] via-[#16213e] to-[#0f0f1a]',
    accentColor: '#818cf8',
    slug: 'rezistory',
  },
  {
    tag: 'Акция',
    title: 'Датчики и сенсоры\nдля IoT-проектов',
    desc: 'DS18B20, DHT22, BMP280, MPU6050. Широкий выбор, быстрая доставка.',
    cta: 'В каталог',
    href: '/catalog?category=datchiki',
    gradient: 'from-[#120a1f] via-[#1e0f35] to-[#120a1f]',
    accentColor: '#c084fc',
    slug: 'datchiki',
  },
]

/* ── Stats ── */
const stats = [
  { icon: Package, value: '500 000+', label: 'позиций в каталоге', color: 'text-[#166534]' },
  { icon: Users,   value: '45 000+',  label: 'постоянных клиентов', color: 'text-indigo-500' },
  { icon: Star,    value: '4.9',      label: 'средняя оценка',      color: 'text-yellow-500' },
  { icon: Clock,   value: '12 лет',   label: 'на рынке',            color: 'text-[#f97316]' },
]

/* ── Features ── */
const features = [
  {
    icon: Truck,
    title: 'Доставка в день заказа',
    desc: 'Отправляем до 15:00. СДЭК, DHL, Почта России по всей России.',
    color: 'text-[#166534]',
    bg: 'bg-[#f0fdf4]',
    border: 'border-[#166534]/10',
  },
  {
    icon: Shield,
    title: 'Оригинальные компоненты',
    desc: 'Только официальные дистрибьюторы. Сертификаты на все позиции.',
    color: 'text-[#f97316]',
    bg: 'bg-orange-50',
    border: 'border-orange-100',
  },
  {
    icon: TrendingUp,
    title: 'Оптовые цены',
    desc: 'Скидки до 40% от 100 единиц. Персональный менеджер для бизнеса.',
    color: 'text-indigo-500',
    bg: 'bg-indigo-50',
    border: 'border-indigo-100',
  },
  {
    icon: Headphones,
    title: 'Техническая поддержка',
    desc: 'Инженеры на связи пн–пт 9:00–18:00. Помощь с подбором и заменами.',
    color: 'text-[#166534]',
    bg: 'bg-[#f0fdf4]',
    border: 'border-[#166534]/10',
  },
]

/* ── Product tabs ── */
type Tab = 'hits' | 'new' | 'sale'
const tabs: { id: Tab; label: string }[] = [
  { id: 'hits', label: '🔥 Хиты продаж' },
  { id: 'new',  label: '✨ Новинки' },
  { id: 'sale', label: '💰 Скидки' },
]

export default function HomePage() {
  const [slide, setSlide] = useState(0)
  const [activeTab, setActiveTab] = useState<Tab>('hits')

  const tabProducts: Record<Tab, typeof products> = {
    hits: featuredProducts,
    new:  products.slice(0, 4),
    sale: products.filter((p) => p.priceWholesale).slice(0, 4),
  }

  const s = slides[slide]

  return (
    <>
      <Header />
      <main className="flex-1 bg-white">

        {/* ══════════════════════════════════
            HERO — Slider + Side banners
        ══════════════════════════════════ */}
        <section className="border-b border-gray-100">
          <div className="mx-auto max-w-7xl px-4 py-5">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

              {/* Slider */}
              <div
                className={`lg:col-span-2 relative rounded-2xl overflow-hidden bg-gradient-to-br ${s.gradient}`}
                style={{ minHeight: 320 }}
              >
                {/* Circuit dot grid */}
                <div
                  className="absolute inset-0 opacity-[0.08]"
                  style={{
                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                  }}
                />

                {/* Big SVG icon — floating */}
                <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-[0.08] animate-float pointer-events-none">
                  <CategoryIcon slug={s.slug} size={200} className="text-white" />
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center h-full p-8 md:p-12">
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-5 w-fit"
                    style={{ backgroundColor: `${s.accentColor}25`, color: s.accentColor }}
                  >
                    <Zap size={10} />{s.tag}
                  </span>
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white mb-3 leading-tight whitespace-pre-line tracking-tight">
                    {s.title}
                  </h2>
                  <p className="text-white/55 text-sm mb-7 max-w-xs leading-relaxed">{s.desc}</p>
                  <Link
                    href={s.href}
                    className="inline-flex items-center gap-2 h-11 px-6 text-sm font-bold rounded-xl w-fit transition-all hover:opacity-90 active:scale-95 shadow-lg"
                    style={{ backgroundColor: s.accentColor, color: '#0a1f10' }}
                  >
                    {s.cta} <ArrowRight size={15} />
                  </Link>
                </div>

                {/* Dots */}
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSlide(i)}
                      className={`rounded-full transition-all duration-300 ${
                        i === slide ? 'w-7 h-2.5 bg-white' : 'size-2.5 bg-white/30 hover:bg-white/50'
                      }`}
                    />
                  ))}
                </div>

                {/* Arrows */}
                <button
                  onClick={() => setSlide((s) => (s - 1 + slides.length) % slides.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center size-9 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-sm"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setSlide((s) => (s + 1) % slides.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center size-9 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-sm"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* Side banners */}
              <div className="flex flex-col gap-4">
                <Link
                  href="/catalog?category=datchiki"
                  className="flex-1 flex flex-col justify-between p-5 rounded-2xl bg-[#f0fdf4] border border-[#166534]/10 hover:border-[#166534]/25 hover:shadow-lg hover:shadow-[#166534]/8 transition-all duration-300 group"
                >
                  <div>
                    <div className="mb-3 animate-float" style={{ animationDelay: '0.5s' }}>
                      <CategoryIcon slug="datchiki" size={44} className="text-[#166534] opacity-60 group-hover:opacity-90 transition-opacity" />
                    </div>
                    <div className="text-base font-bold text-gray-900 mb-1">Датчики и сенсоры</div>
                    <div className="text-sm text-gray-500">DS18B20, DHT22, BMP280</div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-[#166534] mt-4">
                    Смотреть <ArrowRight size={12} />
                  </div>
                </Link>

                <Link
                  href="/wholesale"
                  className="flex-1 flex flex-col justify-between p-5 rounded-2xl bg-orange-50 border border-orange-100 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-100 transition-all duration-300 group"
                >
                  <div>
                    <div className="mb-3 animate-float" style={{ animationDelay: '1s' }}>
                      <CategoryIcon slug="razyomy" size={44} className="text-[#f97316] opacity-60 group-hover:opacity-90 transition-opacity" />
                    </div>
                    <div className="text-base font-bold text-gray-900 mb-1">Оптовые поставки</div>
                    <div className="text-sm text-gray-500">Скидки до 40% от 100 шт.</div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-[#f97316] mt-4">
                    Узнать условия <ArrowRight size={12} />
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════
            STATS
        ══════════════════════════════════ */}
        <section className="border-b border-gray-100 bg-gray-50">
          <div className="mx-auto max-w-7xl px-4 py-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <div className={`flex size-10 items-center justify-center rounded-xl bg-gray-50 shrink-0`}>
                    <stat.icon size={18} className={stat.color} />
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-gray-900 leading-none">{stat.value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════
            CATEGORIES
        ══════════════════════════════════ */}
        <section className="border-b border-gray-100 py-8">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="section-heading">Категории</h2>
              <Link href="/catalog" className="flex items-center gap-1.5 text-sm font-semibold text-[#166534] hover:underline">
                Все категории <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-5 lg:grid-cols-10 gap-3">
              {categories.map((cat) => {
                const theme = catTheme[cat.slug] ?? { bg: 'bg-gray-50', text: 'text-gray-500', hover: 'hover:bg-gray-100', border: 'border-gray-100' }
                return (
                  <Link
                    key={cat.id}
                    href={`/catalog?category=${cat.slug}`}
                    className={`group flex flex-col items-center gap-2.5 p-3 rounded-2xl border ${theme.bg} ${theme.border} ${theme.hover} transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}
                  >
                    <div className="icon-svg">
                      <CategoryIcon
                        slug={cat.slug}
                        size={36}
                        className={`${theme.text} opacity-65 group-hover:opacity-100 transition-opacity`}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-gray-700 text-center leading-tight group-hover:text-gray-900 transition-colors">
                      {cat.name}
                    </span>
                    <span className="text-[10px] text-gray-400">{formatNumber(cat.count)}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════
            PRODUCTS WITH TABS
        ══════════════════════════════════ */}
        <section className="py-10">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-1 bg-gray-100 rounded-2xl p-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-5 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <Link href="/catalog" className="flex items-center gap-1.5 text-sm font-semibold text-[#166534] hover:underline">
                Все товары <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {tabProducts[activeTab].map((product, i) => (
                <div
                  key={product.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════
            FEATURES
        ══════════════════════════════════ */}
        <section className="py-10 bg-gray-50 border-t border-gray-100">
          <div className="mx-auto max-w-7xl px-4">
            <div className="text-center mb-8">
              <h2 className="section-heading mb-2">Почему выбирают нас</h2>
              <p className="text-gray-500 text-sm">Работаем с 2012 года — знаем, что важно для инженеров и закупщиков</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((f, i) => (
                <div
                  key={f.title}
                  className={`flex flex-col gap-4 p-5 bg-white rounded-2xl border ${f.border} shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}
                >
                  <div className={`flex size-11 items-center justify-center rounded-xl ${f.bg}`}>
                    <f.icon size={20} className={f.color} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900 mb-1">{f.title}</div>
                    <div className="text-xs text-gray-500 leading-relaxed">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════
            CTA WHOLESALE
        ══════════════════════════════════ */}
        <section className="py-10">
          <div className="mx-auto max-w-7xl px-4">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f2d1a] via-[#166534] to-[#0f2d1a] px-8 py-12 md:px-14">
              {/* Dot grid */}
              <div
                className="absolute inset-0 opacity-[0.07]"
                style={{
                  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />
              {/* Glow orbs */}
              <div className="absolute -top-16 -right-16 size-64 rounded-full bg-[#f97316]/15 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 size-64 rounded-full bg-[#4ade80]/10 blur-3xl pointer-events-none" />

              {/* Floating icon */}
              <div className="absolute right-12 top-1/2 -translate-y-1/2 opacity-[0.06] animate-float pointer-events-none hidden lg:block">
                <CategoryIcon slug="mikroskhemy" size={180} className="text-white" />
              </div>

              <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold text-green-300 uppercase tracking-widest">Оптовые поставки</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3 leading-tight tracking-tight">
                    Нужен крупный заказ?
                  </h2>
                  <p className="text-sm text-white/55 max-w-md leading-relaxed">
                    Скидки до 40% от 100 единиц. Работаем по договору,
                    выставляем счёт, предоставляем все документы.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                  <Link
                    href="/wholesale"
                    className="flex items-center gap-2 h-12 px-7 text-sm font-bold text-[#166534] bg-white hover:bg-gray-50 rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-95"
                  >
                    Узнать условия <ArrowRight size={15} />
                  </Link>
                  <Link
                    href="/catalog"
                    className="flex items-center justify-center h-12 px-7 text-sm font-semibold text-white/80 bg-white/10 hover:bg-white/15 border border-white/20 rounded-2xl transition-all"
                  >
                    Каталог
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
