import Link from 'next/link'
import { Truck, Shield, Headphones, Zap, ArrowRight, TrendingUp, Package2 } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ProductCard } from '@/components/catalog/product-card'
import { CategoryCard } from '@/components/catalog/category-card'
import { SearchBar } from '@/components/ui/search-bar'
import { categories, featuredProducts } from '@/lib/mock-data'
import { formatNumber } from '@/lib/utils'

const stats = [
  { value: '500к+', label: 'компонентов в каталоге' },
  { value: '24ч', label: 'отправка в день заказа' },
  { value: '12 лет', label: 'на рынке' },
  { value: '45к+', label: 'постоянных клиентов' },
]

const features = [
  {
    icon: Truck,
    title: 'Доставка в день заказа',
    description: 'Отправляем заказы до 15:00 в тот же день. DHL, СДЭК, Почта России.',
    color: 'text-[#22d3ee]',
    bg: 'bg-[#22d3ee]/10',
  },
  {
    icon: Shield,
    title: 'Оригинальные компоненты',
    description: 'Работаем только с официальными дистрибьюторами. Все компоненты сертифицированы.',
    color: 'text-[#818cf8]',
    bg: 'bg-[#818cf8]/10',
  },
  {
    icon: TrendingUp,
    title: 'Оптовые цены',
    description: 'Специальные цены от 100 единиц. Индивидуальные условия для постоянных клиентов.',
    color: 'text-[#34d399]',
    bg: 'bg-[#34d399]/10',
  },
  {
    icon: Headphones,
    title: 'Техническая поддержка',
    description: 'Инженеры на связи пн–пт 9:00–18:00. Помощь с подбором и заменами.',
    color: 'text-[#fb923c]',
    bg: 'bg-[#fb923c]/10',
  },
]

export default function HomePage() {
  const totalProducts = categories.reduce((sum, c) => sum + c.count, 0)

  return (
    <>
      <Header />

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-[#07080f] py-20 md:py-28">
          {/* Grid pattern */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(rgba(34,211,238,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.04) 1px, transparent 1px)',
              backgroundSize: '50px 50px',
            }}
          />
          {/* Bottom glow */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(34,211,238,0.06) 0%, transparent 70%)',
            }}
          />
          {/* Top line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#22d3ee]/20 to-transparent" />

          <div className="relative mx-auto max-w-5xl px-4 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 bg-[#22d3ee]/8 border border-[#22d3ee]/15 rounded-full text-xs text-[#22d3ee] font-medium">
              <Zap size={11} />
              {formatNumber(totalProducts)}+ компонентов в наличии
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#f1f5f9] leading-tight mb-4">
              Электронные компоненты
              <br />
              <span className="text-gradient">для ваших проектов</span>
            </h1>

            <p className="text-base md:text-lg text-[#64748b] max-w-xl mx-auto mb-10 leading-relaxed">
              Резисторы, конденсаторы, микросхемы, датчики и контроллеры.
              Оптом и в розницу — с доставкой по всей России.
            </p>

            {/* Search */}
            <div className="max-w-2xl mx-auto mb-10">
              <SearchBar />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-[#f1f5f9]">{stat.value}</div>
                  <div className="text-xs text-[#64748b] mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Categories ── */}
        <section className="py-14 bg-[#07080f]">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-[#f1f5f9]">Категории</h2>
                <p className="text-sm text-[#64748b] mt-1">{categories.length} категорий · Всегда в наличии</p>
              </div>
              <Link
                href="/catalog"
                className="flex items-center gap-1.5 text-sm text-[#22d3ee] hover:text-[#22d3ee]/80 transition-colors"
              >
                Весь каталог
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Featured products ── */}
        <section className="py-14 bg-[#0a0c19]">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex items-end justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={14} className="text-[#22d3ee]" />
                  <span className="text-xs text-[#22d3ee] uppercase tracking-wider font-medium">Топ продаж</span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-[#f1f5f9]">Популярные компоненты</h2>
              </div>
              <Link
                href="/catalog"
                className="flex items-center gap-1.5 text-sm text-[#22d3ee] hover:text-[#22d3ee]/80 transition-colors"
              >
                Все товары
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="py-14 bg-[#07080f]">
          <div className="mx-auto max-w-7xl px-4">
            <div className="text-center mb-10">
              <h2 className="text-xl md:text-2xl font-bold text-[#f1f5f9]">Почему выбирают нас</h2>
              <p className="text-sm text-[#64748b] mt-2">
                Работаем с 2012 года — знаем, что важно для инженеров и закупщиков
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="flex flex-col gap-3 p-5 bg-[#0d0f1e] border border-white/6 rounded-xl hover:border-white/10 transition-colors"
                >
                  <div className={`flex size-10 items-center justify-center rounded-xl ${feature.bg}`}>
                    <feature.icon size={18} className={feature.color} />
                  </div>
                  <h3 className="text-sm font-semibold text-[#f1f5f9]">{feature.title}</h3>
                  <p className="text-xs text-[#64748b] leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section className="py-10 bg-[#0a0c19]">
          <div className="mx-auto max-w-7xl px-4">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0d0f1e] to-[#111427] border border-[#22d3ee]/15 p-8 md:p-10">
              {/* Glow */}
              <div className="absolute -top-20 -right-20 size-64 rounded-full bg-[#22d3ee]/5 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 size-64 rounded-full bg-[#818cf8]/5 blur-3xl pointer-events-none" />

              <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Package2 size={16} className="text-[#22d3ee]" />
                    <span className="text-xs text-[#22d3ee] uppercase tracking-wider font-medium">Оптовые поставки</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-[#f1f5f9] mb-2">
                    Нужен крупный заказ?
                  </h2>
                  <p className="text-sm text-[#64748b] max-w-md">
                    Специальные цены от 100 единиц. Работаем по договору,
                    выставляем счёт, предоставляем все документы.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                  <Link
                    href="/wholesale"
                    className="flex items-center justify-center gap-2 h-11 px-6 text-sm font-semibold text-[#07080f] bg-[#22d3ee] hover:bg-[#22d3ee]/90 rounded-xl transition-all btn-primary"
                  >
                    Узнать условия
                    <ArrowRight size={15} />
                  </Link>
                  <Link
                    href="/catalog"
                    className="flex items-center justify-center gap-2 h-11 px-6 text-sm font-medium text-[#94a3b8] bg-white/5 hover:bg-white/8 border border-white/8 rounded-xl transition-all"
                  >
                    Открыть каталог
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
