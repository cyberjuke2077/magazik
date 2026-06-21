'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import {
  Headphones, ArrowRight, Package, Layers, Percent, Replace, FileText,
  Truck, Shield, ChevronRight, ChevronLeft,
} from 'lucide-react'

import { ProductCard } from '@/components/catalog/product-card'
import { RecentlyViewed } from '@/components/catalog/recently-viewed'
import { CategoryIcon } from '@/components/ui/component-icons'
import { BRANDS } from '@/lib/brands'
import { type Product } from '@/lib/queries/products'
import { type CatalogSectionView } from '@/lib/queries/categories'

/* Фото категорий (тематичные, public/photos). Маппинг по индексу секции. */
const CATEGORY_PHOTOS = [
  '/photos/cat-1.jpg', '/photos/cat-2.jpg', '/photos/cat-3.jpg',
  '/photos/cat-4.jpg', '/photos/cat-5.jpg', '/photos/cat-6.jpg',
]

/* ── Слайды (на качественных фото public/photos; slide-3..5 в /slider битые) ── */
const slides = [
  { image: '/photos/hero.jpg',  tag: 'Каталог',    title: 'Микроконтроллеры\nи процессоры',  cta: 'Смотреть',  href: '/catalog?category=mikrokontrollery' },
  { image: '/photos/cat-1.jpg', tag: 'Популярное', title: 'Усилители\nи компараторы',          cta: 'Смотреть',  href: '/catalog?category=usiliteli' },
  { image: '/photos/cat-2.jpg', tag: 'Каталог',    title: 'Датчики\nи сенсоры',                cta: 'В каталог', href: '/catalog?category=datchiki' },
  { image: '/photos/cat-3.jpg', tag: 'Питание',    title: 'Управление\nпитанием',              cta: 'Выбрать',   href: '/catalog?category=pitanie' },
  { image: '/photos/cat-4.jpg', tag: 'Каталог',    title: 'Интерфейсы\nи логика',              cta: 'Смотреть',  href: '/catalog?category=interfeysy' },
]

/* ── AUTO-SLIDER HOOK (уважает prefers-reduced-motion) ── */
function useAutoSlider(total: number, interval = 8000) {
  const [current, setCurrent] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function reset() {
    if (timerRef.current) clearInterval(timerRef.current)
    if (typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    timerRef.current = setInterval(() => setCurrent((c) => (c + 1) % total), interval)
  }

  useEffect(() => {
    reset()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, interval])

  function go(idx: number) { setCurrent(idx); reset() }
  function prev() { go((current - 1 + total) % total) }
  function next() { go((current + 1) % total) }
  return { current, go, prev, next }
}

/* ── Features — сервис и экспертиза ── */
const features = [
  { icon: Replace,    title: 'Подбор аналогов',     desc: 'Найдём замену под нужные параметры и бюджет' },
  { icon: Package,    title: 'Поставка под заказ',  desc: 'Привезём позиции, которых нет в наличии' },
  { icon: FileText,   title: 'Документы для юрлиц',  desc: 'Безнал с НДС и закрывающие документы' },
  { icon: Headphones, title: 'Коммерческое предложение', desc: 'Сформируем КП по вашему списку позиций' },
]

/* ── Справочные материалы (реальные страницы, не фейк-блог) ── */
const articles = [
  { photo: '/photos/blog-1.jpg', tag: 'Подбор',   title: 'Аналоги и параметрический поиск компонентов', href: '/help' },
  { photo: '/photos/blog-2.jpg', tag: 'Доставка', title: 'Сроки поставки и отгрузка со склада в Москве', href: '/delivery' },
  { photo: '/photos/blog-3.jpg', tag: 'Юрлицам',  title: 'Работа по безналу: документы, НДС, условия', href: '/contacts' },
]

/* ── ProductModule — Best Sellers (family A: сетка + CTA) ── */
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
        <div className={`rounded-[var(--radius-card)] overflow-hidden ${accent}`}>
          <div className="flex items-center justify-between px-6 pt-6 pb-4">
            <h2 className="text-xl font-bold text-ink">{title}</h2>
            <Link href={href} className="inline-flex items-center gap-1 text-sm font-medium text-azure hover:underline">
              Все <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 px-4 pb-4 gap-3 md:grid-cols-3 lg:grid-cols-5">
            {items.map((product) => (
              <div key={product.id} className="bg-white rounded-[var(--radius-card)] overflow-hidden">
                <ProductCard product={product} />
              </div>
            ))}
            <div className="hidden lg:flex bg-white border border-[var(--border)] rounded-[var(--radius-card)] flex-col justify-between p-5">
              <div>
                <h3 className="text-lg font-bold text-ink mb-2 leading-snug">{ctaTitle}</h3>
                <p className="text-sm text-ink-3 leading-relaxed">{ctaDesc}</p>
              </div>
              <Link href={href} className="ui-btn ui-btn-primary mt-5">
                Перейти к выбору
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── ProductRail — горизонтальный скролл-снап (family B) ── */
function ProductRail({ title, href, products: items }: { title: string; href: string; products: Product[] }) {
  return (
    <section className="py-8">
      <div className="mx-auto max-w-[1400px] px-4">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="section-heading">{title}</h2>
          <Link href={href} className="inline-flex items-center gap-1 text-sm font-medium text-azure hover:underline">
            Смотреть все <ArrowRight size={14} />
          </Link>
        </div>
        <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">
          {items.map((product) => (
            <div key={product.id} className="w-[220px] shrink-0 snap-start">
              <div className="h-full overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-white">
                <ProductCard product={product} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── DealsBlock — accent-промо + сетка карточек (family C) ── */
function DealsBlock({ title, href, products: items }: { title: string; href: string; products: Product[] }) {
  return (
    <section className="py-8">
      <div className="mx-auto max-w-[1400px] px-4">
        <div className="grid gap-3 lg:grid-cols-[320px_1fr]">
          <div className="relative flex flex-col justify-between overflow-hidden rounded-[var(--radius-card)] bg-accent p-6 text-white">
            <div
              className="pointer-events-none absolute inset-0 opacity-15"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
                backgroundSize: '26px 26px',
              }}
            />
            <div className="relative">
              <div className="mb-3 inline-flex size-11 items-center justify-center rounded-[var(--radius-control)] bg-white/20">
                <Percent size={22} />
              </div>
              <h2 className="text-2xl font-extrabold leading-tight">{title}</h2>
              <p className="mt-2 text-sm text-white/85">
                Цены ниже на партии. Запросите КП, подберём аналоги и посчитаем опт.
              </p>
            </div>
            <Link href={href} className="group relative mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-white px-5 text-sm font-bold text-accent transition-colors hover:bg-white/90">
              Смотреть предложения
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {items.slice(0, 4).map((product) => (
              <div key={product.id} className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-white">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════
   HOME CLIENT
══════════════════════════════════════════════════════ */
interface HomeClientProps {
  featuredProducts: Product[]
  popularProducts: Product[]
  bestProducts: Product[]
  sections: CatalogSectionView[]
  totalProducts: number
}

export function HomeClient({ featuredProducts, popularProducts, bestProducts, sections, totalProducts }: HomeClientProps) {
  const homeBrands = BRANDS.filter((b) => b.featured && b.logo).slice(0, 12)
  const featuredCats = sections.slice(0, 6)
  const { current: slide, go, prev, next } = useAutoSlider(slides.length)

  return (
    <main className="flex-1">

      {/* ══════════════════════════════════
          ЗАГОЛОВОК + СЛАЙДЕР (полноразмерный, с миниатюрами)
      ══════════════════════════════════ */}
      <section className="py-8 bg-white">
        <div className="mx-auto max-w-[1400px] px-4">

          {/* Компактная value-prop полоса (h1 + CTA) над слайдером */}
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="max-w-2xl text-2xl font-extrabold leading-tight tracking-tight text-ink md:text-[32px]">
                Электронные компоненты <span className="text-azure">для инженеров и&nbsp;производства</span>
              </h1>
              <p className="text-lead mt-2 max-w-[60ch]">
                <span className="price text-ink">{totalProducts.toLocaleString('ru-RU')}</span>{' '}
                позиций в наличии и под заказ. Подбор аналогов, поставка юрлицам по безналу.
              </p>
            </div>
            <div className="flex shrink-0 gap-3">
              <Link href="/catalog" className="ui-btn ui-btn-primary">В каталог <ArrowRight size={18} /></Link>
              <Link href="/request-quote" className="ui-btn ui-btn-secondary">Запросить КП</Link>
            </div>
          </div>

          {/* Слайдер */}
          <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-white" style={{ height: 375 }}>
            <div className="absolute inset-0">
              <Image src={slides[slide].image} alt={slides[slide].title} fill className="object-cover" priority />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
            </div>

            {/* Подпись слайда */}
            <div className="absolute bottom-6 left-6 z-10 max-w-sm">
              <div className="text-[11px] font-bold uppercase tracking-wide text-white/75">{slides[slide].tag}</div>
              <div className="mt-1 whitespace-pre-line text-2xl font-bold leading-tight text-white">{slides[slide].title}</div>
              <Link href={slides[slide].href} className="group mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-white">
                {slides[slide].cta} <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Стрелки */}
            <button onClick={prev} aria-label="Предыдущий слайд" className="absolute left-3 top-1/2 z-20 flex size-9 -translate-y-1/2 items-center justify-center bg-black/30 text-white hover:bg-black/50">
              <ChevronLeft size={18} />
            </button>
            <button onClick={next} aria-label="Следующий слайд" className="absolute right-3 top-1/2 z-20 flex size-9 -translate-y-1/2 items-center justify-center bg-black/30 text-white hover:bg-black/50">
              <ChevronRight size={18} />
            </button>

            {/* Точки */}
            <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
              {slides.map((_, i) => (
                <button key={i} onClick={() => go(i)} aria-label={`Слайд ${i + 1}`}
                  className={`transition-all ${i === slide ? 'h-2 w-6 bg-white' : 'size-2 bg-white/40 hover:bg-white/60'}`} />
              ))}
            </div>
          </div>

          {/* Миниатюры */}
          <div className="mt-4 grid grid-cols-5 gap-3">
            {slides.map((s, i) => (
              <button key={i} onClick={() => go(i)} aria-label={`Перейти к слайду ${i + 1}`}
                className={`relative overflow-hidden rounded-[var(--radius-control)] ${i === slide ? 'ring-2 ring-azure' : 'opacity-70 hover:opacity-100'}`}
                style={{ height: 120 }}>
                <Image src={s.image} alt={s.title} fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          STATS — реальные/фактические данные
      ══════════════════════════════════ */}
      <section className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto max-w-[1400px] px-4">
          <div className="grid grid-cols-2 divide-x divide-[var(--border)] md:grid-cols-4">
            {[
              { icon: Package, value: totalProducts.toLocaleString('ru-RU'), label: 'позиций в каталоге' },
              { icon: Layers, value: sections.length.toString(), label: 'разделов каталога' },
              { icon: Truck, value: 'по РФ', label: 'доставка со склада в Москве' },
              { icon: Shield, value: 'по безналу', label: 'юрлицам с НДС' },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-5 md:px-6">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-azure-light text-azure">
                  <stat.icon size={20} strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <div className="price text-lg leading-none text-ink">{stat.value}</div>
                  <div className="mt-1 truncate text-xs text-ink-3">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          FEATURED CATEGORIES — крупные фотокарточки
      ══════════════════════════════════ */}
      <section className="py-14 bg-white">
        <div className="mx-auto max-w-[1400px] px-4">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="section-heading">Категории каталога</h2>
            <Link href="/catalog" className="inline-flex items-center gap-1 text-sm font-medium text-azure hover:underline">
              Все категории <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {featuredCats.map((cat, i) => (
              <Link
                key={cat.id}
                href={`/catalog?category=${cat.slug}`}
                className="group flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-white transition-all hover:-translate-y-1 hover:border-azure/40 hover:shadow-[var(--shadow-md)]"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-azure-light">
                  <Image
                    src={CATEGORY_PHOTOS[i % CATEGORY_PHOTOS.length]}
                    alt={cat.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  />
                  <div className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-[var(--radius-control)] bg-white/90 text-azure backdrop-blur-sm">
                    <CategoryIcon slug={cat.icon ?? cat.slug} size={18} />
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-3">
                  <div className="line-clamp-2 text-sm font-bold leading-tight text-ink transition-colors group-hover:text-azure">
                    {cat.name}
                  </div>
                  <div className="mt-1 text-xs text-ink-3">
                    <span className="tnum">{cat.productCount.toLocaleString('ru-RU')}</span> позиций
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          BEST SELLERS — Хиты продаж (family A)
      ══════════════════════════════════ */}
      <ProductModule
        title="Хиты продаж"
        href="/hits"
        products={featuredProducts.slice(0, 4)}
        accent="bg-azure-light/50"
        ctaTitle="Самые популярные товары"
        ctaDesc="Выбор наших покупателей"
      />

      {/* НАБИРАЮТ ПОПУЛЯРНОСТЬ — rail (family B) */}
      <ProductRail title="Набирают популярность" href="/popular" products={popularProducts} />

      {/* ЛУЧШИЕ ПРЕДЛОЖЕНИЯ — accent-промо (family C) */}
      <DealsBlock title="Лучшие предложения" href="/best" products={bestProducts} />

      {/* ══════════════════════════════════
          БРЕНДЫ — logo wall
      ══════════════════════════════════ */}
      <section className="border-y border-[var(--border)] bg-[#fafafa] py-12">
        <div className="mx-auto max-w-[1400px] px-4">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="section-heading">Бренды в каталоге</h2>
            <Link href="/brands" className="inline-flex items-center gap-1 text-sm font-medium text-azure hover:underline">
              Все бренды <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {homeBrands.map((b) => (
              <Link
                key={b.id}
                href={`/catalog?brand=${b.id}`}
                aria-label={b.name}
                className="group flex h-24 items-center justify-center rounded-[var(--radius-card)] border border-[var(--border)] bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-azure/40 hover:shadow-[var(--shadow-md)]"
              >
                <div className="relative h-12 w-full">
                  <Image src={b.logo!} alt={b.name} fill className="object-contain transition-transform group-hover:scale-105" sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 16vw" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          СПРАВОЧНЫЕ МАТЕРИАЛЫ — фотокарточки (реальные страницы)
      ══════════════════════════════════ */}
      <section className="py-14 bg-white">
        <div className="mx-auto max-w-[1400px] px-4">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="section-heading">Полезные материалы</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {articles.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="group flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-white transition-all hover:-translate-y-1 hover:border-azure/40 hover:shadow-[var(--shadow-md)]"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image src={a.photo} alt={a.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" />
                  <span className="absolute left-3 top-3 rounded-[var(--radius-control)] bg-azure px-2.5 py-1 text-[11px] font-bold text-white">
                    {a.tag}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-base font-bold leading-snug text-ink transition-colors group-hover:text-azure">
                    {a.title}
                  </h3>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-azure">
                    Подробнее <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* RECENTLY VIEWED */}
      <RecentlyViewed variant="home" />

      {/* ══════════════════════════════════
          FEATURES — сервис и экспертиза
      ══════════════════════════════════ */}
      <section className="border-t border-[var(--border)] bg-[#fafafa] py-12">
        <div className="mx-auto max-w-[1400px] px-4">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--border)] md:grid-cols-4">
            {features.map((feat, i) => (
              <div key={i} className="flex items-start gap-3 bg-white p-5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-azure-light text-azure">
                  <feat.icon size={20} strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-ink">{feat.title}</div>
                  <div className="mt-1 text-xs leading-relaxed text-ink-3">{feat.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </main>
  )
}
