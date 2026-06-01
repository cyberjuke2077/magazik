'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import {
  Truck, Shield, Headphones, TrendingUp,
  ChevronLeft, ChevronRight,
} from 'lucide-react'

import { ProductCard } from '@/components/catalog/product-card'
import { RecentlyViewed } from '@/components/catalog/recently-viewed'
import { CategoryIcon } from '@/components/ui/component-icons'
import { type Product } from '@/lib/queries/products'
import { type CatalogSectionView } from '@/lib/queries/categories'

/* ── Category theme ── */
const catTheme = {
  bg:    'bg-[#e8f4ff]',
  text:  'text-[#0066cc]',
  border: 'border-[#0066cc]/10',
}

/* ── Slides — баннеры ведут на реальные разделы каталога ── */
const slides = [
  {
    image: '/slider/slide-1.png',
    tag: 'Каталог',
    title: 'Микроконтроллеры\nи процессоры',
    desc: 'MCU, DSP и отладочные платы. Подбор аналогов, поставка под заказ.',
    cta: 'Смотреть',
    href: '/catalog?category=mikrokontrollery',
  },
  {
    image: '/slider/slide-2.png',
    tag: 'Популярное',
    title: 'Усилители\nи компараторы',
    desc: 'ОУ, инструментальные, токовые, видео. Широкий выбор позиций.',
    cta: 'Смотреть',
    href: '/catalog?category=usiliteli',
  },
  {
    image: '/slider/slide-3.png',
    tag: 'Каталог',
    title: 'Датчики\nи сенсоры',
    desc: 'Температура, ускорение, Холл, положение. Для промышленности и IoT.',
    cta: 'В каталог',
    href: '/catalog?category=datchiki',
  },
  {
    image: '/slider/slide-4.png',
    tag: 'Питание',
    title: 'Управление\nпитанием',
    desc: 'DC-DC, AC-DC, стабилизаторы, LDO, источники опорного напряжения.',
    cta: 'Выбрать',
    href: '/catalog?category=pitanie',
  },
  {
    image: '/slider/slide-5.png',
    tag: 'Каталог',
    title: 'Интерфейсы\nи логика',
    desc: 'RS-232/485, изоляторы, коммутаторы, тактирование, логика.',
    cta: 'Смотреть',
    href: '/catalog?category=interfeysy',
  },
]

/* ── Features ── */
const features = [
  { icon: Truck,      title: 'Доставка по России',      desc: 'Со склада в Москве — ТК, почтой или самовывозом' },
  { icon: Shield,     title: 'Оригинальные компоненты',  desc: 'Только официальные дистрибьюторы, сертификаты' },
  { icon: TrendingUp, title: 'Опт и розница',            desc: 'Юр. лицам по безналу с НДС, физлицам — картой' },
  { icon: Headphones, title: 'Ответ за 24 часа',         desc: 'Быстрое формирование коммерческого предложения' },
]

/* ── ProductModule — chipdip "often-slider" style ── */
interface ProductModuleProps {
  title: string
  href: string
  products: Product[]
  accent: string
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
   HOME CLIENT COMPONENT
══════════════════════════════════════════════════════ */
interface HomeClientProps {
  featuredProducts: Product[]
  popularProducts: Product[]
  bestProducts: Product[]
  sections: CatalogSectionView[]
}

export function HomeClient({ featuredProducts, popularProducts, bestProducts, sections }: HomeClientProps) {
  const { current: slide, go, prev, next } = useAutoSlider(slides.length, 8000)

  return (
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
          КАТЕГОРИИ КАТАЛОГА — реальные разделы
      ══════════════════════════════════ */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-[1400px] px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Категории каталога</h2>
            <Link href="/catalog" className="text-sm text-[#0066cc] hover:underline font-medium">
              Все категории
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {sections.slice(0, 12).map((cat) => (
              <Link
                key={cat.id}
                href={`/catalog?category=${cat.slug}`}
                className={`flex items-center justify-between gap-2 p-5 ${catTheme.bg} border border-gray-200 hover:border-[#0066cc] group`}
              >
                <div className="min-w-0">
                  <div className="text-sm font-bold text-gray-900 mb-0.5 leading-tight group-hover:text-[#0066cc] transition-colors line-clamp-2">
                    {cat.name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {cat.productCount.toLocaleString('ru-RU')} позиций
                  </div>
                </div>
                <CategoryIcon slug={cat.icon ?? cat.slug} size={44} className={`${catTheme.text} opacity-40 shrink-0`} />
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
        products={popularProducts.slice(0, 4)}
        accent="bg-[#eef2f6]"
        ctaTitle="Успейте купить первым"
        ctaDesc="Новинки, которые пользуются повышенным спросом"
      />

      {/* ══════════════════════════════════
          ЛУЧШИЕ ПРЕДЛОЖЕНИЯ
      ══════════════════════════════════ */}
      <ProductModule
        title="Лучшие предложения"
        href="/best"
        products={bestProducts.slice(0, 4)}
        accent="bg-[#eef2f6]"
        ctaTitle="Выгодное предложение"
        ctaDesc="Узнайте о выгодных предложениях и специальных ценах."
      />

      {/* ══════════════════════════════════
          RECENTLY VIEWED (localStorage)
      ══════════════════════════════════ */}
      <RecentlyViewed variant="home" />

      {/* ══════════════════════════════════
          FEATURES
      ══════════════════════════════════ */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-[1400px] px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {features.map((feat, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-white border border-gray-200">
                <div className="flex size-10 items-center justify-center bg-[#e8f4ff] text-[#0066cc] shrink-0">
                  <feat.icon size={20} />
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
  )
}
