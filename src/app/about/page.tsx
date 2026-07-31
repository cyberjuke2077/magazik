import type { Metadata } from 'next'
import Link from 'next/link'
import { Users, TrendingUp, Truck, Shield, Award } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'
import { COMPANY } from '@/lib/company'

export const metadata: Metadata = {
  title: 'О компании',
  description:
    'Electromagaz - поставщик электронных компонентов для промышленных предприятий и B2B-клиентов с 2012 года. Более 500 000 позиций в наличии.',
}

const stats = [
  { value: '12+', label: 'лет на рынке' },
  { value: '500k+', label: 'позиций в каталоге' },
  { value: '8 000+', label: 'клиентов' },
  { value: '450+', label: 'брендов' },
]

const values = [
  {
    icon: Shield,
    title: 'Только оригиналы',
    desc: 'Работаем напрямую с авторизованными дистрибьюторами. Каждая партия проходит входной контроль.',
  },
  {
    icon: Truck,
    title: 'Прозрачные сроки',
    desc: 'Указываем реальные сроки поставки. Не обещаем «1 день» там, где это невозможно.',
  },
  {
    icon: Users,
    title: 'B2B-фокус',
    desc: 'Работаем с юридическими лицами и ИП. Все документы в порядке: НДС, сертификаты, ТРО.',
  },
  {
    icon: TrendingUp,
    title: 'Опт от 200 000 ₽',
    desc: 'Гибкая ценовая политика для оптовых клиентов. Индивидуальные коммерческие предложения.',
  },
]

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Header />
      <StickyNav />

      <main className="flex-1">
        <div className="border-b border-[var(--border)]">
          <div className="mx-auto max-w-[1380px] px-4 py-2 lg:px-0">
            <nav className="flex items-center gap-1.5 text-xs text-ink-4">
              <Link href="/" className="hover:text-ink-3 transition-colors">Главная</Link>
              <span>›</span>
              <span className="text-ink-3">О компании</span>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-[1380px] px-4 py-7 lg:px-0">
          {/* Hero */}
          <section className="mb-8 rounded-2xl bg-white p-5 shadow-[var(--shadow-xs)] sm:p-7" data-motion-reveal>
            <h1 className="mb-3 max-w-6xl text-balance text-2xl font-bold leading-tight tracking-[-0.035em] text-ink md:text-3xl">
              Поставляем электронные компоненты для промышленности с 2012 года
            </h1>
            <p className="text-base text-ink-3 max-w-3xl leading-relaxed">
              Electromagaz - оптовый поставщик электронных компонентов и средств промышленной
              автоматизации. Работаем с предприятиями, R&D-отделами, ОКР и серийным производством
              по всей России и СНГ.
            </p>
          </section>

          {/* Stats */}
          <section className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl bg-white p-5 text-center shadow-[var(--shadow-xs)]"
              >
                <div className="mb-1 text-2xl font-extrabold text-azure">{s.value}</div>
                <div className="text-xs text-ink-3">{s.label}</div>
              </div>
            ))}
          </section>

          {/* Values */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-ink mb-5">Принципы работы</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {values.map((v) => (
                <div
                  key={v.title}
                  className="flex gap-4 rounded-2xl bg-white p-5 shadow-[var(--shadow-xs)]"
                >
                  <div className="flex size-10 items-center justify-center bg-azure-light shrink-0 rounded">
                    <v.icon size={18} className="text-azure" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ink mb-1">{v.title}</h3>
                    <p className="text-sm text-ink-3 leading-relaxed">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Reasons */}
          <section className="mb-8 grid gap-5 lg:grid-cols-2">
            <div>
              <h2 className="text-xl font-bold text-ink mb-4">Чем занимаемся</h2>
              <div className="space-y-3 text-sm text-ink-3 leading-relaxed">
                <p>
                  Поставляем компоненты для производственных предприятий: микроконтроллеры,
                  пассивные компоненты, силовую электронику, датчики, разъёмы, средства автоматизации.
                </p>
                <p>
                  Помогаем с подбором аналогов снятых с производства позиций, ищем редкие компоненты
                  через сеть зарубежных поставщиков, работаем с образцами и мелкими партиями для
                  R&D-задач.
                </p>
                <p>
                  Формируем индивидуальные коммерческие предложения по BOM-листу, учитываем
                  требования по сертификатам, маркировке и срокам поставки.
                </p>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-ink mb-4">Реквизиты и документы</h2>
              <div className="space-y-2.5 rounded-2xl bg-white p-5 text-sm shadow-[var(--shadow-xs)]">
                <div className="flex justify-between">
                  <span className="text-ink-3">Наименование</span>
                  <span className="text-ink font-medium text-right">{COMPANY.legalName.replace(/\s*\[ЗАПОЛНИТЬ\]/g, '')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-3">ИНН</span>
                  <span className="text-ink font-medium font-mono">{COMPANY.inn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-3">КПП</span>
                  <span className="text-ink font-medium font-mono">{COMPANY.kpp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-3">ОГРН</span>
                  <span className="text-ink font-medium font-mono">{COMPANY.ogrn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-3">Юр. адрес</span>
                  <span className="text-ink font-medium text-right">{COMPANY.legalAddress.replace(/\s*\[ЗАПОЛНИТЬ\]/g, '')}</span>
                </div>
                <div className="pt-2 border-t border-[var(--border)] text-xs text-ink-3">
                  Полный пакет документов и сертификатов предоставляется по запросу при заключении договора.
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="rounded-2xl bg-azure p-6 lg:p-8" data-motion-reveal>
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Award size={18} className="text-white" />
                  <span className="text-sm font-semibold text-white/80">
                    Готовы начать?
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">Получите коммерческое предложение</h3>
                <p className="text-sm text-white/80">Сформируйте BOM-лист - пришлём цены и сроки в течение 24 часов</p>
              </div>
              <div className="flex gap-3 shrink-0">
                <Link
                  href="/catalog"
                  className="inline-flex h-11 items-center rounded-[var(--radius-control)] bg-white px-6 text-sm font-bold text-azure transition-colors duration-200 hover:bg-surface-muted active:translate-y-px"
                >
                  Перейти в каталог
                </Link>
                <Link
                  href="/contacts"
                  className="inline-flex h-11 items-center rounded-xl border border-white/30 px-6 text-sm font-semibold text-white transition-all hover:bg-white/10"
                >
                  Связаться
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
