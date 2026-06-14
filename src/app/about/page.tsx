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
    'Electromagaz — поставщик электронных компонентов для промышленных предприятий и B2B-клиентов с 2012 года. Более 500 000 позиций в наличии.',
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
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <StickyNav />

      <main className="flex-1">
        <div className="border-b border-gray-100">
          <div className="mx-auto max-w-[1400px] px-4 py-2.5">
            <nav className="flex items-center gap-1.5 text-xs text-gray-400">
              <Link href="/" className="hover:text-gray-600 transition-colors">Главная</Link>
              <span>›</span>
              <span className="text-gray-600">О компании</span>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-[1400px] px-4 py-10">
          {/* Hero */}
          <section className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 max-w-3xl leading-tight">
              Поставляем электронные компоненты для промышленности с 2012 года
            </h1>
            <p className="text-base text-gray-600 max-w-3xl leading-relaxed">
              Electromagaz — оптовый поставщик электронных компонентов и средств промышленной
              автоматизации. Работаем с предприятиями, R&D-отделами, ОКР и серийным производством
              по всей России и СНГ.
            </p>
          </section>

          {/* Stats */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
            {stats.map((s) => (
              <div
                key={s.label}
                className="p-6 bg-[#e8f4ff] border border-gray-200 rounded text-center"
              >
                <div className="text-3xl font-extrabold text-[#0066cc] mb-1">{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            ))}
          </section>

          {/* Values */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-5">Принципы работы</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {values.map((v) => (
                <div
                  key={v.title}
                  className="flex gap-4 p-5 border border-gray-200 rounded bg-white"
                >
                  <div className="flex size-10 items-center justify-center bg-[#e8f4ff] shrink-0 rounded">
                    <v.icon size={18} className="text-[#0066cc]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">{v.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Reasons */}
          <section className="mb-12 grid lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Чем занимаемся</h2>
              <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
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
              <h2 className="text-xl font-bold text-gray-900 mb-4">Реквизиты и документы</h2>
              <div className="p-5 bg-gray-50 border border-gray-200 rounded space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Наименование</span>
                  <span className="text-gray-900 font-medium text-right">{COMPANY.legalName.replace(/\s*\[ЗАПОЛНИТЬ\]/g, '')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">ИНН</span>
                  <span className="text-gray-900 font-medium font-mono">{COMPANY.inn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">КПП</span>
                  <span className="text-gray-900 font-medium font-mono">{COMPANY.kpp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">ОГРН</span>
                  <span className="text-gray-900 font-medium font-mono">{COMPANY.ogrn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Юр. адрес</span>
                  <span className="text-gray-900 font-medium text-right">{COMPANY.legalAddress.replace(/\s*\[ЗАПОЛНИТЬ\]/g, '')}</span>
                </div>
                <div className="pt-2 border-t border-gray-200 text-xs text-gray-500">
                  Полный пакет документов и сертификатов предоставляется по запросу при заключении договора.
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="rounded bg-gradient-to-r from-[#0066cc] to-[#0052a3] p-8 lg:p-10">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Award size={18} className="text-white" />
                  <span className="text-sm font-semibold text-white/80 uppercase tracking-wider">
                    Готовы начать?
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">Получите коммерческое предложение</h3>
                <p className="text-sm text-white/80">Сформируйте BOM-лист — пришлём цены и сроки в течение 24 часов</p>
              </div>
              <div className="flex gap-3 shrink-0">
                <Link
                  href="/catalog"
                  className="h-11 px-6 inline-flex items-center text-sm font-semibold text-[#0066cc] bg-white hover:bg-gray-50 rounded transition-all"
                >
                  Перейти в каталог
                </Link>
                <Link
                  href="/contacts"
                  className="h-11 px-6 inline-flex items-center text-sm font-semibold text-white border border-white/30 hover:bg-white/10 rounded transition-all"
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
