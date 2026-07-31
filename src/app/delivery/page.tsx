import Link from 'next/link'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'
import { MIN_ORDER_AMOUNT, REQUEST_PROCESSING_TIME } from '@/lib/constants'
import { formatPrice } from '@/lib/utils'

const steps = [
  ['Запрос', 'Добавьте позиции в корзину или отправьте список с MPN и количеством.'],
  ['Проверка', `Мы проверим запрос и подготовим ответ в течение ${REQUEST_PROCESSING_TIME} в рабочие дни.`],
  ['Согласование', 'Цена, срок, способ отгрузки и состав документов фиксируются в коммерческом предложении.'],
  ['Оплата и поставка', 'После согласования выставляется счёт. Отгрузка проходит на условиях подтверждённого заказа.'],
] as const

const deliveryOptions = [
  {
    title: 'До терминала транспортной компании',
    description: 'Перевозчик, терминал, стоимость и страхование согласуются для конкретной поставки.',
  },
  {
    title: 'До адреса получателя',
    description: 'Адресная доставка рассчитывается после уточнения города, веса и габаритов отправления.',
  },
  {
    title: 'Самовывоз',
    description: 'Возможность, адрес и время выдачи подтверждаются менеджером до приезда.',
  },
]

const questions = [
  {
    question: 'Когда будет известна точная стоимость доставки?',
    answer: 'После проверки состава заказа, города получения и выбранного способа отгрузки. Стоимость указывается до оплаты.',
  },
  {
    question: 'Какие сроки поставки?',
    answer: 'Срок зависит от доступности каждой позиции и маршрута. Подтверждённая дата указывается в коммерческом предложении.',
  },
  {
    question: 'Как проходит оплата?',
    answer: 'Для юридических лиц и ИП основной способ оплаты - безналичный расчёт по выставленному счёту. Остальные условия фиксируются в договоре.',
  },
  {
    question: 'Какие документы будут у поставки?',
    answer: 'Состав бухгалтерских и сопроводительных документов согласуется для заказа и перечисляется в коммерческом предложении или договоре.',
  },
]

export default function DeliveryPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <StickyNav />

      <main className="flex-1">
        <div className="border-b border-[var(--border)]">
          <div className="mx-auto max-w-[1180px] px-4 py-3">
            <nav className="flex items-center gap-1.5 text-xs text-ink-4" aria-label="Хлебные крошки">
              <Link href="/" className="transition-colors hover:text-azure">Главная</Link>
              <span aria-hidden="true">/</span>
              <span className="text-ink-2">Условия работы и доставка</span>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-[1180px] px-4 py-10 sm:py-14 lg:py-16">
          <section className="grid gap-10 border-b border-[var(--border)] pb-12 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-end lg:gap-16 lg:pb-16">
            <div>
              <p className="mb-4 text-sm font-semibold text-azure">B2B-поставка</p>
              <h1 className="max-w-[14ch] text-[38px] font-bold leading-[1.03] tracking-[-0.045em] text-ink sm:text-[52px]">
                Условия работы и доставка
              </h1>
              <p className="mt-5 max-w-[64ch] text-base leading-relaxed text-ink-3 sm:text-lg">
                Работаем с юридическими лицами и ИП. Конкретные цены, сроки, документы и маршрут подтверждаются для каждого заказа.
              </p>
            </div>

            <dl className="border-l-2 border-azure pl-5 text-sm">
              <div className="border-b border-[var(--border)] pb-3">
                <dt className="text-ink-4">Минимальный заказ</dt>
                <dd className="mt-1 font-semibold text-ink">{formatPrice(MIN_ORDER_AMOUNT)}</dd>
              </div>
              <div className="pt-3">
                <dt className="text-ink-4">Первичный ответ</dt>
                <dd className="mt-1 font-semibold text-ink">В течение {REQUEST_PROCESSING_TIME} в рабочие дни</dd>
              </div>
            </dl>
          </section>

          <section className="py-12 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-16">
              <div>
                <h2 className="text-2xl font-bold tracking-[-0.03em] text-ink">Порядок работы</h2>
                <p className="mt-3 text-sm leading-relaxed text-ink-3">Четыре этапа, на которых условия становятся конкретнее.</p>
              </div>
              <ol className="border-t border-[var(--border)]">
                {steps.map(([title, description], index) => (
                  <li key={title} className="grid gap-3 border-b border-[var(--border)] py-5 sm:grid-cols-[44px_170px_minmax(0,1fr)] sm:gap-5">
                    <span className="font-mono text-xs text-azure">{String(index + 1).padStart(2, '0')}</span>
                    <h3 className="font-semibold text-ink">{title}</h3>
                    <p className="text-sm leading-relaxed text-ink-3">{description}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section className="border-y border-[var(--border)] py-12 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-16">
              <div>
                <h2 className="text-2xl font-bold tracking-[-0.03em] text-ink">Варианты доставки</h2>
                <p className="mt-3 text-sm leading-relaxed text-ink-3">Выбираем маршрут после проверки заказа, а не обещаем универсальные сроки заранее.</p>
              </div>
              <div className="border-t border-[var(--border)]">
                {deliveryOptions.map((option) => (
                  <div key={option.title} className="grid gap-2 border-b border-[var(--border)] py-5 sm:grid-cols-[230px_minmax(0,1fr)] sm:gap-8">
                    <h3 className="font-semibold text-ink">{option.title}</h3>
                    <p className="text-sm leading-relaxed text-ink-3">{option.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-10 py-12 lg:grid-cols-2 lg:gap-16 lg:py-16">
            <div>
              <h2 className="text-2xl font-bold tracking-[-0.03em] text-ink">Оплата и документы</h2>
              <p className="mt-4 text-sm leading-relaxed text-ink-3">
                Счёт выставляется после согласования коммерческого предложения. Набор бухгалтерских и сопроводительных документов зависит от условий поставки и требований к партии.
              </p>
              <Link href="/legal" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-azure hover:text-azure-hover">
                Реквизиты компании
                <ArrowRight size={15} />
              </Link>
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-[-0.03em] text-ink">Возврат и расхождения</h2>
              <p className="mt-4 text-sm leading-relaxed text-ink-3">
                Если товар повреждён, не соответствует согласованной позиции или есть вопрос к качеству, зафиксируйте состояние партии и свяжитесь с нами. Порядок рассмотрения описан отдельно.
              </p>
              <Link href="/returns" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-azure hover:text-azure-hover">
                Условия возврата
                <ArrowRight size={15} />
              </Link>
            </div>
          </section>

          <section className="border-t border-[var(--border)] pt-12 lg:pt-16">
            <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-16">
              <h2 className="text-2xl font-bold tracking-[-0.03em] text-ink">Частые вопросы</h2>
              <div className="border-t border-[var(--border)]">
                {questions.map((item) => (
                  <details key={item.question} className="group border-b border-[var(--border)]">
                    <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold text-ink">
                      {item.question}
                      <ChevronDown size={18} className="shrink-0 text-ink-4 transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="max-w-[70ch] pb-5 pr-8 text-sm leading-relaxed text-ink-3">{item.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  )
}
