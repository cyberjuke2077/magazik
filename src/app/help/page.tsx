import Link from 'next/link'
import { ArrowRight, ChevronDown, Mail, Phone } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'
import { COMPANY } from '@/lib/company'

const helpSections = [
  {
    title: 'Найти компонент',
    description: 'Поиск по MPN, названию и производителю. Для параметрического поиска используйте категории и фильтры.',
    href: '/catalog',
    action: 'Открыть каталог',
  },
  {
    title: 'Получить цену и срок',
    description: 'Добавьте позиции и количество в корзину. Итоговые условия фиксируются в коммерческом предложении.',
    href: '/cart',
    action: 'Перейти в корзину',
  },
  {
    title: 'Уточнить доставку и документы',
    description: 'Способ отгрузки, комплект документов и требования к партии согласуются до оплаты.',
    href: '/delivery',
    action: 'Условия работы',
  },
  {
    title: 'Задать технический вопрос',
    description: 'Если нужен аналог, datasheet или проверка корпуса, опишите задачу и укажите исходный MPN.',
    href: '/support',
    action: 'Техническая поддержка',
  },
]

const questions = [
  {
    question: 'Как оформить запрос?',
    answer: 'Найдите товары в каталоге, добавьте нужное количество в корзину и заполните форму запроса. Если списка ещё нет, можно перейти сразу к форме коммерческого предложения.',
  },
  {
    question: 'Почему у части товаров нет цены?',
    answer: 'Цена и доступность зависят от партии и поставщика. Для таких позиций мы уточняем условия и включаем их в коммерческое предложение.',
  },
  {
    question: 'Можно ли запросить аналог?',
    answer: 'Да. Укажите исходный MPN и критичные параметры. Предложенный вариант нужно проверить и согласовать до заказа.',
  },
  {
    question: 'Где найти datasheet?',
    answer: 'Ссылка отображается в каталоге и на странице товара, если документ уже привязан к позиции. По отсутствующему документу можно отправить запрос в техническую поддержку.',
  },
  {
    question: 'Как узнать состав документов?',
    answer: 'Укажите требования при оформлении запроса. Состав сопроводительных документов будет зафиксирован в коммерческом предложении и договоре.',
  },
]

export default function HelpPage() {
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
              <span className="text-ink-2">Помощь</span>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-[1180px] px-4 py-10 sm:py-14 lg:py-16">
          <section className="grid gap-8 border-b border-[var(--border)] pb-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end lg:gap-16 lg:pb-14">
            <div>
              <h1 className="max-w-[15ch] text-[38px] font-bold leading-[1.03] tracking-[-0.045em] text-ink sm:text-[50px]">
                Помощь по заказам и компонентам
              </h1>
              <p className="mt-5 max-w-[62ch] text-base leading-relaxed text-ink-3">
                Короткие маршруты к каталогу, коммерческому предложению, доставке и техническим вопросам.
              </p>
            </div>

            <div className="grid gap-2 border-l-2 border-azure pl-5 text-sm">
              <a href={`tel:${COMPANY.phone.raw}`} className="inline-flex items-center gap-2 font-medium text-ink transition-colors hover:text-azure">
                <Phone size={16} />
                {COMPANY.phone.display}
              </a>
              <a href={`mailto:${COMPANY.supportEmail}`} className="inline-flex items-center gap-2 font-medium text-ink transition-colors hover:text-azure">
                <Mail size={16} />
                {COMPANY.supportEmail}
              </a>
              <p className="mt-1 text-xs leading-relaxed text-ink-4">Для ответа по товару укажите MPN, производителя и нужное количество.</p>
            </div>
          </section>

          <section className="py-10 lg:py-14">
            <h2 className="text-2xl font-bold tracking-[-0.03em] text-ink">Что нужно сделать</h2>
            <div className="mt-7 border-t border-[var(--border)]">
              {helpSections.map((section) => (
                <Link
                  key={section.title}
                  href={section.href}
                  className="group grid gap-3 border-b border-[var(--border)] py-6 transition-colors hover:bg-surface-muted sm:grid-cols-[220px_minmax(0,1fr)_180px] sm:items-center sm:px-4"
                >
                  <h3 className="font-semibold text-ink">{section.title}</h3>
                  <p className="text-sm leading-relaxed text-ink-3">{section.description}</p>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-azure sm:justify-self-end">
                    {section.action}
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section className="border-t border-[var(--border)] pt-10 lg:pt-14">
            <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-16">
              <div>
                <h2 className="text-2xl font-bold tracking-[-0.03em] text-ink">Частые вопросы</h2>
                <p className="mt-3 text-sm leading-relaxed text-ink-3">Ответы описывают текущий B2B-процесс без обещаний, которые не подтверждены заказом.</p>
              </div>
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
