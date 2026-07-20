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
  AlertCircle,
  Package,
  Calculator,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'
import { MIN_ORDER_AMOUNT, CONTACT_PHONE, REQUEST_PROCESSING_TIME } from '@/lib/constants'
import { formatPrice } from '@/lib/utils'

const workflowSteps = [
  {
    icon: FileText,
    title: 'Отправка запроса',
    desc: 'Вы формируете список товаров и отправляете запрос на коммерческое предложение через сайт',
  },
  {
    icon: Calculator,
    title: 'Согласование КП',
    desc: 'Мы связываемся с вами в течение 24 часов, согласовываем цену, сроки и условия поставки',
  },
  {
    icon: Building,
    title: 'Выставление счёта',
    desc: 'После согласования выставляем счёт на оплату с полным пакетом документов',
  },
  {
    icon: Truck,
    title: 'Закупка и доставка',
    desc: 'После оплаты закупаем товар у поставщиков и организуем доставку до вашего склада',
  },
]

const deliveryOptions = [
  {
    icon: Truck,
    name: 'Транспортная компания',
    description: 'Организуем доставку через проверенные ТК (Деловые Линии, ПЭК, Байкал-Сервис). Стоимость и сроки рассчитываются индивидуально.',
    features: ['Доставка до терминала или склада', 'Страхование груза', 'Трекинг отправления'],
  },
  {
    icon: Package,
    name: 'Курьерская доставка',
    description: 'Для срочных заказов организуем курьерскую доставку по Москве и МО. Доставка в день готовности заказа.',
    features: ['Доставка до двери', 'Гибкий график', 'Только Москва и МО'],
  },
  {
    icon: Building,
    name: 'Самовывоз',
    description: 'Вы можете забрать заказ самостоятельно после согласования готовности. Предварительный звонок обязателен.',
    features: ['Бесплатно', 'По предварительной договорённости', 'Москва'],
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
      'Полный пакет документов (счёт, УПД, счёт-фактура)',
      'Отсрочка платежа для постоянных клиентов',
      'НДС 20%',
    ],
  },
  {
    icon: FileText,
    name: 'Предоплата 100%',
    description: 'Для новых клиентов требуется полная предоплата. После оплаты начинаем закупку товара.',
    badge: 'Для новых клиентов',
    badgeColor: 'text-accent bg-accent/8 border-accent/15',
    features: [
      'Оплата после согласования КП',
      'Закупка начинается после поступления средств',
      'Все документы предоставляются',
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
    a: `Минимальная сумма заказа - ${formatPrice(MIN_ORDER_AMOUNT)}. Мы работаем только с оптовыми заказами для юридических лиц и ИП.`,
  },
  {
    q: 'Как быстро вы отвечаете на запрос?',
    a: `Мы обрабатываем запросы в течение ${REQUEST_PROCESSING_TIME} в рабочие дни. Вы получите коммерческое предложение с ценами и сроками поставки.`,
  },
  {
    q: 'Откуда вы закупаете товар?',
    a: 'Мы работаем напрямую с официальными дистрибьюторами и производителями. Все компоненты оригинальные, с сертификатами.',
  },
  {
    q: 'Какие сроки поставки?',
    a: 'Сроки зависят от наличия товара у поставщиков. Обычно 7-21 день с момента оплаты. Точные сроки согласовываем в коммерческом предложении.',
  },
  {
    q: 'Можно ли получить отсрочку платежа?',
    a: 'Да, для постоянных клиентов возможна отсрочка платежа до 30 дней. Условия обсуждаются индивидуально.',
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
    a: 'Возврат возможен в течение 14 дней, если товар ненадлежащего качества или не соответствует заказу. Товар должен быть в оригинальной упаковке, без следов монтажа.',
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
        <div className="bg-white py-12">
          <div className="mx-auto max-w-[1440px] px-3 sm:px-6">
            <h1 className="mb-2 text-2xl font-bold text-ink">Условия работы и доставка</h1>
            <p className="text-ink-3 max-w-2xl text-lg">
              Работаем под заказ с юридическими лицами и ИП. Минимальная сумма заказа - {formatPrice(MIN_ORDER_AMOUNT)}.
              Ответ на запрос в течение {REQUEST_PROCESSING_TIME}.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-[1440px] space-y-10 px-3 pb-10 sm:px-6">

          {/* Key info banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { icon: Building, label: 'Только для бизнеса', sub: 'Юр. лица и ИП', color: 'text-azure', bg: 'bg-azure-light' },
              { icon: Calculator, label: `Минимальный заказ ${formatPrice(MIN_ORDER_AMOUNT)}`, sub: 'Оптовые поставки', color: 'text-accent', bg: 'bg-orange-50' },
              { icon: Clock, label: 'Ответ за 24 часа', sub: 'Быстрое формирование КП', color: 'text-azure', bg: 'bg-azure-light' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-4 p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
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
                  <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow h-full">
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
                <div key={option.name} className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
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
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Важно:</strong> Стоимость и сроки доставки рассчитываются индивидуально и включаются в коммерческое предложение.
                Мы организуем доставку до вашего склада или терминала ТК в вашем городе.
              </p>
            </div>
          </section>

          {/* Payment methods */}
          <section>
            <h2 className="text-2xl font-bold text-ink mb-6">Способы оплаты</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {paymentMethods.map((method) => (
                <div key={method.name} className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
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
          <section>
            <h2 className="text-2xl font-bold text-ink mb-6">Документы</h2>
            <div className="bg-white rounded-lg shadow-sm p-8">
              <p className="text-sm text-ink-3 mb-6">
                Мы предоставляем полный пакет документов для бухгалтерии. Все документы оформляются в соответствии с требованиями законодательства РФ.
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
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-base font-bold text-ink mb-4 flex items-center gap-2">
                    <CheckCircle2 size={20} className="text-green-600" />
                    Принимаем возврат
                  </h3>
                  <ul className="space-y-3">
                    {[
                      'Товар ненадлежащего качества',
                      'Товар не соответствует заказу',
                      'Брак или дефект компонента',
                      'Повреждение при транспортировке',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm text-ink-2">
                        <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink mb-4 flex items-center gap-2">
                    <AlertCircle size={20} className="text-accent" />
                    Не принимаем возврат
                  </h3>
                  <ul className="space-y-3">
                    {[
                      'Товар надлежащего качества',
                      'Товар со следами монтажа или пайки',
                      'Нарушена заводская упаковка',
                      'Прошло более 14 дней с момента получения',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm text-ink-2">
                        <AlertCircle size={16} className="text-accent shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-[var(--border)] text-sm text-ink-3">
                Для оформления возврата свяжитесь с нами в течение 14 дней с момента получения заказа.
                Возврат денежных средств осуществляется в течение 10 рабочих дней после получения товара.
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section>
            <h2 className="text-2xl font-bold text-ink mb-6">Частые вопросы</h2>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
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
          <section className="bg-gradient-to-br from-azure-light to-[#f0f9ff] rounded-lg p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <h2 className="text-xl font-bold text-ink mb-2">Готовы начать работу?</h2>
                <p className="text-sm text-ink-3">Отправьте запрос на коммерческое предложение или свяжитесь с нами напрямую</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <Link
                  href="/catalog"
                  className="flex h-11 items-center justify-center gap-2 rounded bg-accent px-6 text-sm font-bold text-white transition-colors hover:bg-accent-hover"
                >
                  Выбрать товары
                </Link>
                <a
                  href={`tel:${CONTACT_PHONE.replace(/\s/g, '')}`}
                  className="flex items-center justify-center gap-2 h-11 px-6 text-sm font-semibold text-ink-2 bg-white hover:bg-[#fafafa] rounded-lg transition-all shadow-sm"
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
