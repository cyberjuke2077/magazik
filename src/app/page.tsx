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
// Положи свои фотографии в public/slider/
const slides = [
  {
    image: '/slider/slide-1.png',
    tag: 'Новинки',
    title: 'Микроконтроллеры\nSTM32 и ESP32',
    desc: 'ARM Cortex-M, WiFi, Bluetooth — всё в наличии. Доставка 1–2 недели.',
    cta: 'Смотреть',
    href: '/catalog?category=kontrollery',
  },
  {
    image: '/slider/slide-2.png',
    tag: 'Популярное',
    title: 'Пассивные\nкомпоненты',
    desc: 'Резисторы, конденсаторы Yageo и Murata. Широкий выбор, доставка 1–2 недели.',
    cta: 'Смотреть',
    href: '/catalog?category=rezistory',
  },
  {
    image: '/slider/slide-3.png',
    tag: 'Акция',
    title: 'Датчики и сенсоры\nдля IoT-проектов',
    desc: 'DS18B20, DHT22, BMP280, MPU6050. Широкий выбор, доставка 1–2 недели.',
    cta: 'В каталог',
    href: '/catalog?category=datchiki',
  },
  {
    image: '/slider/slide-4.png',
    tag: 'Хит',
    title: 'Разъёмы и\nсоединители',
    desc: 'USB Type-C, JST, Molex, XT60. Более 35 000 позиций в наличии.',
    cta: 'Выбрать',
    href: '/catalog?category=razyomy',
  },
  {
    image: '/slider/slide-5.png',
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
  { icon: Truck,      title: 'Работаем под заказ',      desc: 'Минимальный заказ от 200 000 ₽', color: 'text-[#0066cc]', bg: 'bg-[#e8f4ff]' },
  { icon: Shield,     title: 'Оригинальные компоненты',   desc: 'Только официальные дистрибьюторы',       color: 'text-[#f97316]', bg: 'bg-orange-50' },
  { icon: TrendingUp, title: 'Для юр. лиц и ИП',              desc: 'Работаем с организациями по всей России',   color: 'text-[#0066cc]', bg: 'bg-[#e8f4ff]' },
  { icon: Headphones, title: 'Ответ за 24 часа',              desc: 'Быстрое формирование коммерческого предложения',     color: 'text-[#0066cc]', bg: 'bg-[#e8f4ff]' },
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
    <section className="py-8">
      <div className="mx-auto max-w-[1400px] px-4">
        <div className={`rounded overflow-hidden ${accent}`}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4">
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <div className="flex items-center gap-1">
              <Link
                href={href}
                className="flex items-center justify-center size-7 rounded bg-white/70 hover:bg-white text-gray-500 border border-gray-200/60"
              >
                <ChevronLeft size={14} />
              </Link>
              <Link
                href={href}
                className="flex items-center justify-center size-7 rounded bg-white/70 hover:bg-white text-gray-500 border border-gray-200/60"
              >
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>

          {/* Cards row — 4 карточки + CTA */}
          <div className="grid grid-cols-5 px-4 pb-4 gap-3">
            {items.map((product) => (
              <div key={product.id} className="bg-white rounded overflow-hidden">
                <ProductCard product={product} />
              </div>
            ))}

            {/* CTA card */}
            <div className="bg-white border border-gray-200 flex flex-col justify-between p-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 leading-snug">{ctaTitle}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{ctaDesc}</p>
              </div>
              <Link
                href={href}
                className="mt-5 flex items-center justify-center h-11 px-4 text-sm font-bold text-white bg-[#0066cc] hover:bg-[#0052a3] rounded"
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
  const { current: slide, go, prev, next } = useAutoSlider(slides.length, 8000)

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <StickyNav />
      <main className="flex-1">

        {/* ══════════════════════════════════
            MAIN SLIDER — chipdip style
            (в контейнере, не на весь экран)
        ══════════════════════════════════ */}
        <section className="py-8 bg-white">
          <div className="mx-auto max-w-[1400px] px-4">

            {/* Слайдер — как у chipdip: фиксированная высота, скруглённые углы */}
            <div className="relative overflow-hidden rounded bg-white border border-gray-200" style={{ height: 375 }}>

              {/* Фото слайда */}
              <div className="absolute inset-0">
                <Image
                  src={slides[slide].image}
                  alt={slides[slide].title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              {/* Стрелки */}
              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center size-9 bg-black/30 hover:bg-black/50 text-white"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center size-9 bg-black/30 hover:bg-black/50 text-white"
              >
                <ChevronRight size={18} />
              </button>

              {/* Точки */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => go(i, i > slide ? 'right' : 'left')}
                    className={`transition-all ${
                      i === slide ? 'w-6 h-2 bg-white' : 'size-2 bg-white/40 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Миниатюры слайдов */}
            <div className="mt-4 grid grid-cols-5 gap-3">
              {slides.map((s, i) => (
                <button
                  key={i}
                  onClick={() => go(i, i > slide ? 'right' : 'left')}
                  className={`relative overflow-hidden rounded ${
                    i === slide 
                      ? 'ring-2 ring-[#0066cc]' 
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ height: 120 }}
                >
                  <Image
                    src={s.image}
                    alt={s.title}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════
            NEWS (без партнёрского баннера)
        ══════════════════════════════════ */}
        <section className="py-16 bg-white">
          <div className="mx-auto max-w-[1400px] px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Новости</h2>
              <Link href="/brands" className="text-sm text-[#0066cc] hover:underline font-medium">
                Все новости
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {news.map((item) => (
                <Link
                  key={item.slug}
                  href="/brands"
                  className="flex items-start gap-3 p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200"
                >
                  <div className="flex size-10 items-center justify-center bg-white shrink-0">
                    <Zap size={14} className="text-[#0066cc]" />
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-400 mb-1">{item.date}</div>
                    <div className="text-xs font-semibold text-gray-800 leading-snug line-clamp-2">
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
        <section className="py-16 bg-white">
          <div className="mx-auto max-w-[1400px] px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Популярные категории</h2>
              <Link href="/catalog" className="text-sm text-[#0066cc] hover:underline font-medium">
                Все категории
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Large tile — Микросхемы */}
              <Link
                href="/catalog?category=mikroskhemy"
                className="row-span-2 flex flex-col justify-between p-6 bg-[#e8f4ff] border border-gray-200 hover:border-[#0066cc] group min-h-[280px]"
              >
                <div>
                  <div className="text-lg font-bold text-gray-900 mb-1">Микросхемы</div>
                  <div className="text-xs text-gray-500">62 000 позиций</div>
                </div>
                <div className="flex justify-end">
                  <CategoryIcon slug="mikroskhemy" size={100} className="text-[#0066cc] opacity-50" />
                </div>
              </Link>

              {[
                { slug: 'rezistory',    label: 'Резисторы',    count: '48 200', size: 60 },
                { slug: 'kondensatory', label: 'Конденсаторы', count: '31 500', size: 60 },
              ].map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/catalog?category=${cat.slug}`}
                  className={`flex items-center justify-between p-5 ${catTheme.bg} border border-gray-200 hover:border-[#0066cc] group`}
                >
                  <div>
                    <div className="text-sm font-bold text-gray-900 mb-0.5">{cat.label}</div>
                    <div className="text-xs text-gray-400">{cat.count}</div>
                  </div>
                  <CategoryIcon slug={cat.slug} size={cat.size} className={`${catTheme.text} opacity-40`} />
                </Link>
              ))}

              {/* Large tile — Контроллеры */}
              <Link
                href="/catalog?category=kontrollery"
                className="row-span-2 flex flex-col justify-between p-6 bg-[#e8f4ff] border border-gray-200 hover:border-[#0066cc] group min-h-[280px]"
              >
                <div>
                  <div className="text-lg font-bold text-gray-900 mb-1">Контроллеры</div>
                  <div className="text-xs text-gray-500">9 400 позиций</div>
                </div>
                <div className="flex justify-end">
                  <CategoryIcon slug="kontrollery" size={100} className="text-[#0066cc] opacity-50" />
                </div>
              </Link>

              {[
                { slug: 'tranzistory', label: 'Транзисторы', count: '18 700', size: 60 },
                { slug: 'datchiki',    label: 'Датчики',     count: '12 800', size: 60 },
              ].map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/catalog?category=${cat.slug}`}
                  className={`flex items-center justify-between p-5 ${catTheme.bg} border border-gray-200 hover:border-[#0066cc] group`}
                >
                  <div>
                    <div className="text-sm font-bold text-gray-900 mb-0.5">{cat.label}</div>
                    <div className="text-xs text-gray-400">{cat.count}</div>
                  </div>
                  <CategoryIcon slug={cat.slug} size={cat.size} className={`${catTheme.text} opacity-40`} />
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
                  className={`flex items-center justify-between p-4 ${catTheme.bg} border border-gray-200 hover:border-[#0066cc] group`}
                >
                  <div>
                    <div className="text-sm font-bold text-gray-900 mb-0.5">{cat.label}</div>
                    <div className="text-xs text-gray-400">{cat.count}</div>
                  </div>
                  <CategoryIcon slug={cat.slug} size={44} className={`${catTheme.text} opacity-35`} />
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
        <section className="py-16 bg-gray-50">
          <div className="mx-auto max-w-[1400px] px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {features.map((feat, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-white border border-gray-200">
                  <div className={`flex size-10 items-center justify-center ${feat.bg} shrink-0`}>
                    <feat.icon size={20} className={feat.color} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900 mb-1">{feat.title}</div>
                    <div className="text-xs text-gray-500 leading-relaxed">{feat.desc}</div>
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
