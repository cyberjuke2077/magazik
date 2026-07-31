'use client'

import Link from 'next/link'
import {
  ChevronRight,
  Truck,
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
import { CONTACT_PHONE } from '@/lib/constants'

const workflowSteps = [
  {
    icon: FileText,
    title: 'Сбор корзины',
    desc: 'Вы добавляете товары в корзину и переходите к оформлению заказа',
  },
  {
    icon: Calculator,
    title: 'Согласование КП',
    desc: 'Менеджер проверяет позиции и фиксирует цену, срок и условия поставки',
  },
  {
    icon: Building,
    title: 'Документы сделки',
    desc: 'Способ оплаты и доступный комплект документов указываются до оплаты',
  },
  {
    icon: Truck,
    title: 'Исполнение поставки',
    desc: 'Заказ исполняется по срокам и способу передачи, согласованным в документах',
  },
]

const deliveryOptions = [
  {
    icon: Truck,
    name: 'До терминала',
    description: 'Возможность передачи через транспортную компанию проверяется для конкретного направления.',
    features: ['Перевозчик согласуется', 'Стоимость указывается в КП', 'Срок подтверждается до оплаты'],
  },
  {
    icon: Package,
    name: 'До адреса',
    description: 'Адресная доставка может быть включена в предложение после проверки маршрута и параметров груза.',
    features: ['Адрес указывает покупатель', 'Условия фиксируются в КП', 'Передача подтверждается документами'],
  },
  {
    icon: Building,
    name: 'Самовывоз',
    description: 'Возможность, адрес и время самовывоза подтверждаются менеджером до оплаты.',
    features: ['Только после подтверждения', 'Адрес указывается в документах', 'Получатель должен быть согласован'],
  },
]

const paymentMethods = [
  {
    icon: Building,
    name: 'Условия в счёте',
    description: 'Сумма, срок и назначение платежа указываются в документе для конкретной заявки.',
    badge: 'Для заявки',
    badgeColor: 'text-azure bg-azure/8 border-azure/15',
    features: [
      'Реквизиты поставщика',
      'Согласованная сумма',
      'Срок действия условий',
      'Ссылка на состав заявки',
    ],
  },
  {
    icon: FileText,
    name: 'Условия в договоре',
    description: 'Если для сделки нужен договор, порядок и этапы оплаты согласуются сторонами отдельно.',
    badge: 'При необходимости',
    badgeColor: 'text-accent bg-accent/8 border-accent/15',
    features: [
      'Порядок оплаты',
      'Срок исполнения',
      'Способ поставки',
      'Комплект документов',
    ],
  },
]

const documents = [
  'Счёт на оплату',
  'Договор при необходимости',
  'Передаточные документы по согласованной сделке',
  'Документы на товар при их наличии',
]

const faq = [
  {
    q: 'Какая минимальная сумма заказа?',
    a: 'Минимальная сумма публично не фиксируется. Отправьте состав и количество позиций для расчёта.',
  },
  {
    q: 'Как быстро вы отвечаете на запрос?',
    a: 'Срок обработки зависит от количества позиций и доступности данных. Результат фиксируется в коммерческом предложении.',
  },
  {
    q: 'Откуда вы закупаете товар?',
    a: 'Источник поставки и доступные подтверждающие документы необходимо запросить для конкретной позиции до оплаты.',
  },
  {
    q: 'Какие сроки поставки?',
    a: 'Срок зависит от наличия и выбранного способа поставки. Точная дата указывается в коммерческом предложении.',
  },
  {
    q: 'Можно ли получить отсрочку платежа?',
    a: 'Порядок и срок оплаты определяются коммерческим предложением или договором. Публичная отсрочка не гарантируется.',
  },
  {
    q: 'Работаете ли вы с физическими лицами?',
    a: 'Нет, мы специализируемся на B2B поставках и работаем только с юридическими лицами и индивидуальными предпринимателями.',
  },
  {
    q: 'Какие документы нужны для работы?',
    a: 'Для заявки нужны контактные данные и состав позиций. Дополнительные реквизиты запрашиваются при подготовке документов.',
  },
  {
    q: 'Возможен ли возврат товара?',
    a: 'Направьте обращение с номером заказа и материалами. Основание и порядок рассматриваются по документам сделки и применимому законодательству.',
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
              Работаем с заявками юридических лиц и ИП. Цена, срок, оплата и способ
              поставки подтверждаются для конкретного перечня позиций.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-[1380px] space-y-10 px-3 pb-12 sm:px-6">

          {/* Key info banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { icon: Building, label: 'Только для бизнеса', sub: 'Юр. лица и ИП', color: 'text-azure', bg: 'bg-azure-light' },
              { icon: Calculator, label: 'Расчёт по заявке', sub: 'Цена и количество в КП', color: 'text-azure', bg: 'bg-azure-light' },
              { icon: FileText, label: 'Условия до оплаты', sub: 'Срок, поставка и документы', color: 'text-azure', bg: 'bg-azure-light' },
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
                Не оплачивайте заявку, пока способ и адрес передачи не подтверждены в документах.
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
                Состав документов зависит от условий сделки и выбранных позиций. Запросите
                необходимый комплект до согласования коммерческого предложения.
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

          {/* Return requests */}
          <section>
            <h2 className="text-2xl font-bold text-ink mb-6">Возврат и обмен</h2>
            <div className="rounded-2xl bg-white p-8 shadow-sm">
              <p className="text-sm text-ink-3 leading-relaxed">
                Если товар не соответствует согласованной поставке, направьте номер заказа,
                описание и подтверждающие материалы на рабочий email. Порядок обращения
                определяется документами сделки и применимым законодательством.
              </p>
              <Link href="/returns" className="mt-5 inline-flex text-sm font-semibold text-azure hover:underline">
                Порядок направления обращения
              </Link>
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
                  href={`tel:${CONTACT_PHONE.replace(/\s/g, '')}`}
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
