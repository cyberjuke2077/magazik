'use client'

import Link from 'next/link'
import {
  ChevronRight,
  Truck,
  Clock,
  Building,
  FileText,
  Phone,
  CheckCircle2,
  Package,
  Calculator,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'
import { COMPANY } from '@/lib/company'

const workflowSteps = [
  {
    icon: FileText,
    title: 'Сбор корзины',
    desc: 'Вы добавляете товары в корзину и переходите к оформлению заказа',
  },
  {
    icon: Calculator,
    title: 'Согласование КП',
    desc: 'Менеджер проверяет позиции и согласовывает цену, сроки и условия поставки',
  },
  {
    icon: Building,
    title: 'Выставление счёта',
    desc: 'После согласования фиксируем состав документов и выставляем счёт на оплату',
  },
  {
    icon: Truck,
    title: 'Закупка и доставка',
    desc: 'После выполнения условий оплаты организуем поставку согласованным способом',
  },
]

const deliveryOptions = [
  {
    icon: Truck,
    name: 'Транспортная компания',
    description: 'Перевозчик, маршрут, стоимость и сроки согласуются в коммерческом предложении.',
    features: ['До терминала или адреса', 'Условия страхования уточняются', 'Трекинг зависит от перевозчика'],
  },
  {
    icon: Package,
    name: 'Адресная доставка',
    description: 'Возможность адресной доставки проверяется для конкретного города и состава заказа.',
    features: ['Адрес указывается в заявке', 'Срок подтверждает менеджер', 'Стоимость включается в КП'],
  },
  {
    icon: Building,
    name: 'Самовывоз',
    description: 'Возможность и адрес самовывоза указываются в коммерческом предложении, если этот вариант доступен.',
    features: ['Только после подтверждения', 'Адрес фиксируется в КП', 'Дата согласуется заранее'],
  },
]

const paymentMethods = [
  {
    icon: Building,
    name: 'Безналичный расчёт',
    description: 'Основной способ оплаты для юридических лиц и ИП. Работаем по договору поставки.',
    badge: 'Рекомендуем',
    badgeColor: 'text-azure bg-azure/8 border-azure/15',
    features: [
      'Оплата по счёту',
      'Оплата по реквизитам из счёта',
      'Состав документов фиксируется в КП',
      'Налоговые условия указываются в счёте',
    ],
  },
  {
    icon: FileText,
    name: 'Условия оплаты',
    description: 'Порядок и срок оплаты согласуются для конкретной поставки и фиксируются в документах.',
    badge: 'По согласованию',
    badgeColor: 'text-accent bg-accent/8 border-accent/15',
    features: [
      'Оплата после согласования КП',
      'Условия фиксируются до поставки',
      'Состав документов подтверждается отдельно',
    ],
  },
]

const documents = [
  'Счёт на оплату',
  'Договор поставки (при необходимости)',
  'Товарная накладная (ТОРГ-12)',
  'Счёт-фактура',
  'УПД (универсальный передаточный документ)',
  'Сертификаты соответствия (по запросу)',
]

const faq = [
  {
    q: 'Какая минимальная сумма заказа?',
    a: 'Минимальная сумма и партия зависят от выбранных позиций и указываются в коммерческом предложении.',
  },
  {
    q: 'Как быстро вы отвечаете на запрос?',
    a: 'Менеджер обрабатывает заявку и связывается с вами для подтверждения цены, наличия и сроков поставки.',
  },
  {
    q: 'Откуда вы закупаете товар?',
    a: 'Источник поставки и доступные документы проверяются для конкретной позиции до согласования коммерческого предложения.',
  },
  {
    q: 'Какие сроки поставки?',
    a: 'Срок зависит от наличия и маршрута поставки. Точная дата указывается в коммерческом предложении.',
  },
  {
    q: 'Можно ли получить отсрочку платежа?',
    a: 'Порядок оплаты является предметом конкретного коммерческого предложения и договора.',
  },
  {
    q: 'Работаете ли вы с физическими лицами?',
    a: 'Нет, мы специализируемся на B2B поставках и работаем только с юридическими лицами и индивидуальными предпринимателями.',
  },
  {
    q: 'Какие документы нужны для работы?',
    a: 'Для оформления заказа нужны: название компании, ИНН, контактное лицо, телефон и email. Договор поставки заключаем при необходимости.',
  },
  {
    q: 'Возможен ли возврат товара?',
    a: 'Условия возврата определяются договором, коммерческим предложением и применимым законодательством. Для обращения свяжитесь с менеджером.',
  },
]

export default function DeliveryPage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Header />
      <StickyNav />

      <main>
        {/* Breadcrumb */}
        <div className="bg-white">
          <div className="mx-auto max-w-[1440px] px-3 py-2 sm:px-6">
            <nav className="flex items-center gap-1.5 text-xs text-ink-4">
              <Link href="/" className="hover:text-ink-3 transition-colors">Главная</Link>
              <ChevronRight size={10} />
              <span className="text-ink-3">Условия работы</span>
            </nav>
          </div>
        </div>

        {/* Hero */}
        <div className="bg-white py-8">
          <div className="mx-auto max-w-[1380px] px-3 sm:px-6">
            <h1 className="mb-2 max-w-6xl text-3xl font-bold tracking-[-0.03em] text-ink">Условия работы и доставка</h1>
            <p className="text-ink-3 max-w-2xl text-lg">
              Работаем под заказ с юридическими лицами и ИП. Цена, минимальная партия,
              способ оплаты и срок поставки подтверждаются в коммерческом предложении.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-[1380px] space-y-10 px-3 pb-12 sm:px-6">

          {/* Key info banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { icon: Building, label: 'Только для бизнеса', sub: 'Юр. лица и ИП', color: 'text-azure', bg: 'bg-azure-light' },
              { icon: Calculator, label: 'Условия в КП', sub: 'Цена и минимальная партия', color: 'text-azure', bg: 'bg-azure-light' },
              { icon: Clock, label: 'Связь с менеджером', sub: 'После обработки заявки', color: 'text-azure', bg: 'bg-azure-light' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-4 rounded-2xl bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className={`flex size-12 items-center justify-center rounded-lg ${item.bg} shrink-0`}>
                  <item.icon size={22} className={item.color} />
                </div>
                <div>
                  <div className="text-sm font-bold text-ink">{item.label}</div>
                  <div className="text-xs text-ink-3 mt-1">{item.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Workflow */}
          <section>
            <h2 className="text-2xl font-bold text-ink mb-6">Как мы работаем</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {workflowSteps.map((step, i) => (
                <div key={i} className="relative">
                  <div className="h-full rounded-2xl bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex size-12 items-center justify-center rounded-lg bg-azure-light">
                        <step.icon size={22} className="text-azure" />
                      </div>
                      <span className="text-2xl font-bold text-gray-200">{i + 1}</span>
                    </div>
                    <h3 className="text-sm font-bold text-ink mb-2">{step.title}</h3>
                    <p className="text-xs text-ink-3 leading-relaxed">{step.desc}</p>
                  </div>
                  {i < workflowSteps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gray-200 -translate-y-1/2" />
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Delivery options */}
          <section>
            <h2 className="text-2xl font-bold text-ink mb-6">Варианты доставки</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {deliveryOptions.map((option) => (
                <div key={option.name} className="rounded-2xl bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex size-12 items-center justify-center rounded-lg bg-azure-light">
                      <option.icon size={22} className="text-azure" />
                    </div>
                    <h3 className="text-base font-bold text-ink">{option.name}</h3>
                  </div>
                  <p className="text-sm text-ink-3 leading-relaxed mb-4">{option.description}</p>
                  <ul className="space-y-2">
                    {option.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-xs text-ink-2">
                        <CheckCircle2 size={14} className="text-green-600 shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl bg-azure-light p-5">
              <p className="text-sm text-blue-800">
                <strong>Важно:</strong> Стоимость и сроки доставки рассчитываются индивидуально и включаются в коммерческое предложение.
                Доступные варианты и маршрут подтверждаются менеджером до согласования заказа.
              </p>
            </div>
          </section>

          {/* Payment methods */}
          <section>
            <h2 className="text-2xl font-bold text-ink mb-6">Способы оплаты</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {paymentMethods.map((method) => (
                <div key={method.name} className="rounded-2xl bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex size-12 items-center justify-center rounded-lg bg-azure-light">
                      <method.icon size={20} className="text-azure" />
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${method.badgeColor}`}>
                      {method.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-ink mb-2">{method.name}</h3>
                  <p className="text-sm text-ink-3 leading-relaxed mb-4">{method.description}</p>
                  <ul className="space-y-2">
                    {method.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-xs text-ink-2">
                        <CheckCircle2 size={14} className="text-green-600 shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Documents */}
          <section id="documents" className="scroll-mt-40">
            <h2 className="text-2xl font-bold text-ink mb-6">Документы</h2>
            <div className="rounded-2xl bg-white p-8 shadow-sm">
              <p className="text-sm text-ink-3 mb-6">
                Возможный комплект документов перечислен ниже. Фактический состав подтверждается для конкретной поставки в КП или договоре.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {documents.map((doc) => (
                  <div key={doc} className="flex items-start gap-3 p-4 bg-[#f8fafc] rounded-lg">
                    <FileText size={18} className="text-azure shrink-0 mt-0.5" />
                    <span className="text-sm text-ink">{doc}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Return policy */}
          <section>
            <h2 className="text-2xl font-bold text-ink mb-6">Возврат и обмен</h2>
            <div className="rounded-2xl bg-white p-8 shadow-sm">
              <p className="text-sm leading-relaxed text-ink-3">
                Возможность и порядок возврата зависят от причины обращения, состояния товара,
                условий конкретной поставки и применимого законодательства. Направьте менеджеру
                номер заявки и описание ситуации - обращение будет рассмотрено по документам сделки.
              </p>
            </div>
          </section>

          {/* FAQ */}
          <section>
            <h2 className="text-2xl font-bold text-ink mb-6">Частые вопросы</h2>
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
              {faq.map((item, i) => (
                <div
                  key={i}
                  className={`px-8 py-6 ${i !== 0 ? 'border-t border-[var(--border)]' : ''} hover:bg-[#fafafa] transition-colors`}
                >
                  <h3 className="text-sm font-bold text-ink mb-2">{item.q}</h3>
                  <p className="text-sm text-ink-3 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Contact */}
          <section className="rounded-2xl bg-azure p-8 text-white shadow-sm" data-motion-reveal>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <h2 className="mb-2 text-xl font-bold text-white">Готовы оформить заказ?</h2>
                <p className="text-sm text-white/75">Соберите товары в корзину или свяжитесь с нами напрямую</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <Link
                  href="/catalog"
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-bold text-azure transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
                >
                  Выбрать товары
                </Link>
                <a
                  href={`tel:${COMPANY.phone.raw}`}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 text-sm font-semibold text-white transition-all hover:bg-white/20"
                >
                  <Phone size={16} />
                  Позвонить
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
