import Link from 'next/link'
import { Truck, Shield, Headphones, Zap, ArrowRight, TrendingUp, Package2 } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { CategoryCard } from '@/components/catalog/category-card'
import { SearchBar } from '@/components/ui/search-bar'
import { categories } from '@/lib/mock-data'
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
    color: 'text-[#166534]',
    bg: 'bg-[#166534]/8',
    border: 'border-[#166534]/12',
  },
  {
    icon: Shield,
    title: 'Оригинальные компоненты',
    description: 'Работаем только с официальными дистрибьюторами. Все компоненты сертифицированы.',
    color: 'text-[#f97316]',
    bg: 'bg-[#f97316]/8',
    border: 'border-[#f97316]/12',
  },
  {
    icon: TrendingUp,
    title: 'Оптовые цены',
    description: 'Специальные цены от 100 единиц. Индивидуальные условия для постоянных клиентов.',
    color: 'text-[#166534]',
    bg: 'bg-[#166534]/8',
    border: 'border-[#166534]/12',
  },
  {
    icon: Headphones,
    title: 'Техническая поддержка',
    description: 'Инженеры на связи пн–пт 9:00–18:00. Помощь с подбором и заменами.',
    color: 'text-[#f97316]',
    bg: 'bg-[#f97316]/8',
    border: 'border-[#f97316]/12',
  },
]

export default function HomePage() {
  const totalProducts = categories.reduce((sum, c) => sum + c.count, 0)

  return (
    <>
      <Header />

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-[#fffaf7] py-20 md:py-28">
          {/* Subtle circuit grid */}
          <div className="absolute inset-0 hero-grid" />
          {/* Peach glow bottom */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 70% 50% at 50% 110%, rgba(249,115,22,0.07) 0%, transparent 70%)',
            }}
          />
          {/* Green glow top-left */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 50% 40% at 0% 0%, rgba(22,101,52,0.05) 0%, transparent 60%)',
            }}
          />
          {/* Top border line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#166534]/20 to-transparent" />

          <div className="relative mx-auto max-w-5xl px-4 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 bg-[#166534]/8 border border-[#166534]/15 rounded-full text-xs text-[#166534] font-medium">
              <Zap size={11} />
              {formatNumber(totalProducts)}+ компонентов в наличии
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#1c1917] leading-tight mb-4">
              Электронные компоненты
              <br />
              <span className="text-gradient">для ваших проектов</span>
            </h1>

            <p className="text-base md:text-lg text-[#78716c] max-w-xl mx-auto mb-10 leading-relaxed">
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
                  <div className="text-2xl md:text-3xl font-bold text-[#1c1917]">{stat.value}</div>
                  <div className="text-xs text-[#78716c] mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Categories ── */}
        <section className="py-14 bg-white">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-[#1c1917]">Категории</h2>
                <p className="text-sm text-[#78716c] mt-1">{categories.length} категорий · Всегда в наличии</p>
              </div>
              <Link
                href="/catalog"
                className="flex items-center gap-1.5 text-sm text-[#166534] hover:text-[#15803d] font-medium transition-colors"
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

        {/* ── Features ── */}
        <section className="py-14 bg-[#fffaf7]">
          <div className="mx-auto max-w-7xl px-4">
            <div className="text-center mb-10">
              <h2 className="text-xl md:text-2xl font-bold text-[#1c1917]">Почему выбирают нас</h2>
              <p className="text-sm text-[#78716c] mt-2">
                Работаем с 2012 года — знаем, что важно для инженеров и закупщиков
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className={`flex flex-col gap-3 p-5 bg-white border ${feature.border} rounded-xl hover:shadow-md transition-all card-hover`}
                >
                  <div className={`flex size-10 items-center justify-center rounded-xl ${feature.bg}`}>
                    <feature.icon size={18} className={feature.color} />
                  </div>
                  <h3 className="text-sm font-semibold text-[#1c1917]">{feature.title}</h3>
                  <p className="text-xs text-[#78716c] leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section className="py-10 bg-white">
          <div className="mx-auto max-w-7xl px-4">
            <div className="relative overflow-hidden rounded-2xl bg-[#166534] p-8 md:p-10">
              {/* Subtle pattern */}
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
                  backgroundSize: '30px 30px',
                }}
              />
              {/* Peach glow */}
              <div className="absolute -top-16 -right-16 size-56 rounded-full bg-[#f97316]/20 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 size-56 rounded-full bg-white/5 blur-3xl pointer-events-none" />

              <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Package2 size={16} className="text-[#fed7aa]" />
                    <span className="text-xs text-[#fed7aa] uppercase tracking-wider font-medium">Оптовые поставки</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
                    Нужен крупный заказ?
                  </h2>
                  <p className="text-sm text-white/70 max-w-md">
                    Специальные цены от 100 единиц. Работаем по договору,
                    выставляем счёт, предоставляем все документы.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                  <Link
                    href="/wholesale"
                    className="flex items-center justify-center gap-2 h-11 px-6 text-sm font-semibold text-[#166534] bg-white hover:bg-[#fffaf7] rounded-xl transition-all btn-primary shadow-sm"
                  >
                    Узнать условия
                    <ArrowRight size={15} />
                  </Link>
                  <Link
                    href="/catalog"
                    className="flex items-center justify-center gap-2 h-11 px-6 text-sm font-medium text-white/80 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl transition-all"
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
