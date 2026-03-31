'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import {
  Truck, Shield, Headphones, TrendingUp,
  ArrowRight, ChevronLeft, ChevronRight, Zap,
} from 'lucide-react'

import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'
import { ProductCard } from '@/components/catalog/product-card'
import { CategoryIcon } from '@/components/ui/component-icons'
import { categories, products, featuredProducts } from '@/lib/mock-data'

/* ── Category theme ── */
const catTheme = {
  bg:    'bg-[#e8f4ff]',
  text:  'text-[#0066cc]',
  border: 'border-[#0066cc]/10',
}

/* ── Slides — разное фото для каждого слайда ── */
// Путь к изображению: `/slider/slide-1.jpg` (положить в public/slider/)
const slides = [
  {
    image: '/slider/slide-1.jpg',  // TODO: добавить фото слайда
    tag: 'Новинки',
    title: 'Микроконтроллеры\nSTM32 и ESP32',
    desc: 'ARM Cortex-M, WiFi, Bluetooth — всё в наличии. Доставка 1–2 недели.',
    cta: 'Смотреть',
    href: '/catalog?category=kontrollery',
  },
  {
    image: '/slider/slide-2.jpg',  // TODO: добавить фото слайда
    tag: 'Популярное',
    title: 'Пассивные\nкомпоненты',
    desc: 'Резисторы, конденсаторы Yageo и Murata. Широкий выбор, доставка 1–2 недели.',
    cta: 'Смотреть',
    href: '/catalog?category=rezistory',
  },
  {
    image: '/slider/slide-3.jpg',  // TODO: добавить фото слайда
    tag: 'Акция',
    title: 'Датчики и сенсоры\nдля IoT-проектов',
    desc: 'DS18B20, DHT22, BMP280, MPU6050. Широкий выбор, доставка 1–2 недели.',
    cta: 'В каталог',
    href: '/catalog?category=datchiki',
  },
  {
    image: '/slider/slide-4.jpg',  // TODO: добавить фото слайда
    tag: 'Хит',
    title: 'Разъёмы и\nсоединители',
    desc: 'USB Type-C, JST, Molex, XT60. Более 35 000 позиций в наличии.',
    cta: 'Выбрать',
    href: '/catalog?category=razyomy',
  },
  {
    image: '/slider/slide-5.jpg',  // TODO: добавить фото слайда
    tag: 'Скидки',
    title: 'Диоды и\nтранзисторы',
    desc: 'IRF540N, BC547, 1N4007, SS34. Оригинальные компоненты от ведущих брендов.',
    cta: 'Смотреть',
    href: '/catalog?category=diody',
  },
]

/* ── News ── */
const news = [
  { date: '28.03.2026', title: 'Новые микроконтроллеры STM32H7 — расширенный ассортимент', slug: 'stm32h7' },
  { date: '25.03.2026', title: 'Поступление датчиков Sensirion SHT40 и SCD41', slug: 'sensirion' },
  { date: '20.03.2026', title: 'Скидки до 30% на конденсаторы Murata серии GRM', slug: 'murata-sale' },
  { date: '15.03.2026', title: 'Новые разъёмы Molex Micro-Fit 3.0 в наличии', slug: 'molex' },
]

/* ── Features ── */
const features = [
  { icon: Truck,      title: 'Доставка 1–2 недели',      desc: 'СДЭК, DHL, Почта России по всей стране', color: 'text-[#0066cc]', bg: 'bg-[#e8f4ff]' },
  { icon: Shield,     title: 'Оригинальные компоненты',   desc: 'Только официальные дистрибьюторы',       color: 'text-[#f97316]', bg: 'bg-orange-50' },
  { icon: TrendingUp, title: 'Выгодные цены',              desc: 'Конкурентные цены на весь ассортимент',   color: 'text-[#0066cc]', bg: 'bg-[#e8f4ff]' },
  { icon: Headphones, title: 'Техподдержка',              desc: 'Инженеры на связи пн–пт 9:00–18:00',     color: 'text-[#0066cc]', bg: 'bg-[#e8f4ff]' },
]

/* ── ProductModule — chipdip "often-slider" style ── */
interface ProductModuleProps {
  title: string
  href: string
  products: typeof import('@/lib/mock-data').products
  accent: string   // цвет фона секции
  ctaTitle: string
  ctaDesc: string
}

function ProductModule({ title, href, products: items, accent, ctaTitle, ctaDesc }: ProductModuleProps) {
  return (
    <section className="py-3">
      <div className="mx-auto max-w-[1400px] px-4">
        <div className={`rounded overflow-hidden ${accent}`}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4">
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <div className="flex items-center gap-1">
              <Link
                href={href}
                className="flex items-center justify-center size-7 rounded-sm bg-white/70 hover:bg-white text-gray-500 hover:text-gray-800 transition-all border border-gray-200/60"
              >
                <ChevronLeft size={14} />
              </Link>
              <Link
                href={href}
                className="flex items-center justify-center size-7 rounded-sm bg-white/70 hover:bg-white text-gray-500 hover:text-gray-800 transition-all border border-gray-200/60"
              >
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>

          {/* Cards row — 4 карточки + CTA */}
          <div className="grid grid-cols-5 px-4 pb-4 gap-3">
            {items.map((product) => (
              <div key={product.id} className="bg-white rounded overflow-hidden shadow-sm">
                <ProductCard product={product} />
              </div>
            ))}

            {/* CTA card */}
            <div className="bg-white rounded border border-gray-200 flex flex-col justify-between p-5 shadow-sm">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 leading-snug">{ctaTitle}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{ctaDesc}</p>
              </div>
              <Link
                href={href}
                className="mt-5 flex items-center justify-center h-11 px-4 text-sm font-bold text-white bg-[#1c2d38] hover:bg-[#0f1e27] rounded transition-all"
              >
                Перейти к выбору
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════
   AUTO-SLIDER HOOK
══════════════════════════════════════════════════════ */
function useAutoSlider(total: number, interval = 6000) {
  const [current, setCurrent] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [direction, setDirection] = useState<'left' | 'right'>('right')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function reset() {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setDirection('right')
      setAnimating(true)
      setTimeout(() => {
        setCurrent((c) => (c + 1) % total)
        setAnimating(false)
      }, 400)
    }, interval)
  }

  useEffect(() => {
    reset()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [total, interval])

  function go(idx: number, dir: 'left' | 'right' = 'right') {
    if (animating) return
    setDirection(dir)
    setAnimating(true)
    setTimeout(() => {
      setCurrent(idx)
      setAnimating(false)
    }, 400)
    reset()
  }

  function prev() { go((current - 1 + total) % total, 'left') }
  function next() { go((current + 1) % total, 'right') }

  return { current, go, prev, next }
}

/* ══════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════ */
export default function HomePage() {
  const { current: slide, go, prev, next } = useAutoSlider(slides.length, 6000)

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <StickyNav />
      <main className="flex-1">

        {/* ══════════════════════════════════
            MAIN SLIDER — chipdip style
            (в контейнере, не на весь экран)
        ══════════════════════════════════ */}
        <section className="border-b border-gray-100 py-4 bg-white">
          <div className="mx-auto max-w-[1400px] px-4">

            {/* Слайдер — как у chipdip: фиксированная высота, скруглённые углы */}
            <div className="relative overflow-hidden rounded bg-black" style={{ height: 375 }}>

              {/* Фото — placeholder пока нет изображений */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center">
                  <div className="text-6xl mb-2">📷</div>
                  <p className="text-lg font-medium text-gray-500">{slides[slide].tag}</p>
                  <p className="text-sm text-gray-400 mt-1">Изображение появится позже</p>
                </div>
              </div>

              {/* Стрелки */}
              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center size-9 rounded-sm bg-black/25 hover:bg-black/50 text-white transition-all backdrop-blur-sm"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center size-9 rounded-sm bg-black/25 hover:bg-black/50 text-white transition-all backdrop-blur-sm"
              >
                <ChevronRight size={18} />
              </button>

              {/* Точки */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => go(i, i > slide ? 'right' : 'left')}
                    className={`rounded-sm transition-all duration-300 ${
                      i === slide ? 'w-6 h-2 bg-white' : 'size-2 bg-white/40 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Превью-миниатюры — как у chipdip */}
            <div className="grid mt-2" style={{ gridTemplateColumns: `repeat(${slides.length}, 1fr)`, gap: '6px' }}>
              {slides.map((s, i) => (
                <button
                  key={i}
                  onClick={() => go(i, i > slide ? 'right' : 'left')}
                  className={`relative overflow-hidden rounded transition-all duration-200 ${
                    i === slide
                      ? 'ring-2 ring-[#0066cc] ring-offset-1'
                      : 'opacity-60 hover:opacity-90'
                  }`}
                  style={{ aspectRatio: '16/9' }}
                >
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-xs text-gray-400 font-medium">
                    {s.tag}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════
            NEWS (без партнёрского баннера)
        ══════════════════════════════════ */}
        <section className="border-b border-gray-100 py-10">
          <div className="mx-auto max-w-[1400px] px-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Новости</h2>
              <Link href="/brands" className="text-sm text-[#0066cc] hover:underline font-medium">
                Все новости
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {news.map((item) => (
                <Link
                  key={item.slug}
                  href="/brands"
                  className="flex items-start gap-3 p-3 rounded bg-gray-50 hover:bg-[#e8f4ff] border border-gray-100 hover:border-[#0066cc]/15 transition-all duration-200 group"
                >
                  <div className="flex size-10 items-center justify-center rounded bg-white border border-gray-100 shrink-0">
                    <Zap size={14} className="text-[#0066cc]" />
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-400 mb-1">{item.date}</div>
                    <div className="text-xs font-semibold text-gray-800 leading-snug group-hover:text-[#0066cc] transition-colors line-clamp-2">
                      {item.title}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════
            POPULAR CATEGORIES
        ══════════════════════════════════ */}
        <section className="border-b border-gray-100 py-10">
          <div className="mx-auto max-w-[1400px] px-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Популярные категории</h2>
              <Link href="/catalog" className="text-sm text-[#0066cc] hover:underline font-medium">
                Все категории
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Large tile — Микросхемы */}
              <Link
                href="/catalog?category=mikroskhemy"
                className="row-span-2 flex flex-col justify-between p-6 rounded bg-[#e8f4ff] border border-[#0066cc]/10 hover:border-[#0066cc]/25 hover:shadow-lg transition-all duration-300 group min-h-[280px]"
              >
                <div>
                  <div className="text-lg font-bold text-gray-900 mb-1 group-hover:text-[#0052a3] transition-colors">Микросхемы</div>
                  <div className="text-xs text-gray-500">62 000 позиций</div>
                </div>
                <div className="flex justify-end">
                  <div className="animate-float">
                    <CategoryIcon slug="mikroskhemy" size={100} className="text-[#0066cc] opacity-50 group-hover:opacity-80 transition-opacity" />
                  </div>
                </div>
              </Link>

              {[
                { slug: 'rezistory',    label: 'Резисторы',    count: '48 200', size: 60 },
                { slug: 'kondensatory', label: 'Конденсаторы', count: '31 500', size: 60 },
              ].map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/catalog?category=${cat.slug}`}
                  className={`flex items-center justify-between p-5 rounded ${catTheme.bg} border ${catTheme.border} hover:shadow-md transition-all duration-200 group`}
                >
                  <div>
                    <div className="text-sm font-bold text-gray-900 mb-0.5">{cat.label}</div>
                    <div className="text-xs text-gray-400">{cat.count}</div>
                  </div>
                  <CategoryIcon slug={cat.slug} size={cat.size} className={`${catTheme.text} opacity-40 group-hover:opacity-70 transition-opacity`} />
                </Link>
              ))}

              {/* Large tile — Контроллеры */}
              <Link
                href="/catalog?category=kontrollery"
                className="row-span-2 flex flex-col justify-between p-6 rounded bg-[#e8f4ff] border border-[#0066cc]/10 hover:border-[#0066cc]/25 hover:shadow-lg transition-all duration-300 group min-h-[280px]"
              >
                <div>
                  <div className="text-lg font-bold text-gray-900 mb-1 group-hover:text-[#0052a3] transition-colors">Контроллеры</div>
                  <div className="text-xs text-gray-500">9 400 позиций</div>
                </div>
                <div className="flex justify-end">
                  <div className="animate-float" style={{ animationDelay: '1s' }}>
                    <CategoryIcon slug="kontrollery" size={100} className="text-[#0066cc] opacity-50 group-hover:opacity-80 transition-opacity" />
                  </div>
                </div>
              </Link>

              {[
                { slug: 'tranzistory', label: 'Транзисторы', count: '18 700', size: 60 },
                { slug: 'datchiki',    label: 'Датчики',     count: '12 800', size: 60 },
              ].map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/catalog?category=${cat.slug}`}
                  className={`flex items-center justify-between p-5 rounded ${catTheme.bg} border ${catTheme.border} hover:shadow-md transition-all duration-200 group`}
                >
                  <div>
                    <div className="text-sm font-bold text-gray-900 mb-0.5">{cat.label}</div>
                    <div className="text-xs text-gray-400">{cat.count}</div>
                  </div>
                  <CategoryIcon slug={cat.slug} size={cat.size} className={`${catTheme.text} opacity-40 group-hover:opacity-70 transition-opacity`} />
                </Link>
              ))}

              {[
                { slug: 'diody',      label: 'Диоды',      count: '22 300' },
                { slug: 'svetodiody', label: 'Светодиоды', count: '8 900' },
                { slug: 'rele',       label: 'Реле',       count: '4 200' },
                { slug: 'razyomy',    label: 'Разъёмы',    count: '35 600' },
              ].map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/catalog?category=${cat.slug}`}
                  className={`flex items-center justify-between p-4 rounded ${catTheme.bg} border ${catTheme.border} hover:shadow-md transition-all duration-200 group`}
                >
                  <div>
                    <div className="text-sm font-bold text-gray-900 mb-0.5">{cat.label}</div>
                    <div className="text-xs text-gray-400">{cat.count}</div>
                  </div>
                  <CategoryIcon slug={cat.slug} size={44} className={`${catTheme.text} opacity-35 group-hover:opacity-65 transition-opacity`} />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════
            ХИТЫ ПРОДАЖ — chipdip style
        ══════════════════════════════════ */}
        <ProductModule
          title="Хиты продаж"
          href="/hits"
          products={featuredProducts.slice(0, 4)}
          accent="bg-[#dbeeff]"
          ctaTitle="Самые популярные товары"
          ctaDesc="Выбор наших покупателей"
        />

        {/* ══════════════════════════════════
            НАБИРАЮТ ПОПУЛЯРНОСТЬ
        ══════════════════════════════════ */}
        <ProductModule
          title="Набирают популярность"
          href="/popular"
          products={products.filter((p) => !p.featured).slice(0, 4)}
          accent="bg-[#d6f5e8]"
          ctaTitle="Успейте купить первым"
          ctaDesc="Новинки, которые пользуются повышенным спросом"
        />

        {/* ══════════════════════════════════
            ЛУЧШИЕ ПРЕДЛОЖЕНИЯ
        ══════════════════════════════════ */}
        <ProductModule
          title="Лучшие предложения"
          href="/best"
          products={products.filter((p) => p.priceWholesale).slice(0, 4)}
          accent="bg-[#ede8ff]"
          ctaTitle="Выгодное предложение"
          ctaDesc="Узнайте о выгодных предложениях и специальных ценах. Только в этом месяце!"
        />

        {/* ══════════════════════════════════
            FEATURES
        ══════════════════════════════════ */}
        <section className="py-12 bg-gray-50 border-b border-gray-100 mt-4">
          <div className="mx-auto max-w-[1400px] px-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((f) => (
                <div key={f.title} className="flex items-start gap-4 p-5 bg-white rounded border border-gray-100 shadow-sm">
                  <div className={`flex size-11 items-center justify-center rounded ${f.bg} shrink-0`}>
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



      </main>
      <Footer />
    </div>
  )
}
