import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'

export const metadata: Metadata = {
  title: 'О компании',
  description:
    'Electromagaz помогает бизнесу подбирать и заказывать электронные компоненты по MPN и спецификациям.',
}

const capabilities = [
  {
    title: 'Поиск по MPN',
    description: 'Проверяем конкретную маркировку, производителя, корпус и доступные варианты поставки.',
  },
  {
    title: 'Работа со спецификацией',
    description: 'Принимаем перечень позиций, уточняем количество и собираем единое коммерческое предложение.',
  },
  {
    title: 'Подбор аналога',
    description: 'Сопоставляем ключевые параметры и документацию. Замену согласуем до включения в предложение.',
  },
  {
    title: 'Документы',
    description: 'Состав документов и требования к партии фиксируем в предложении и договоре поставки.',
  },
]

const process = [
  ['Запрос', 'Вы отправляете MPN, BOM-лист или собираете позиции в корзине.'],
  ['Уточнение', 'Мы проверяем производителя, количество, корпус, сроки и требования к документам.'],
  ['Предложение', 'Вы получаете согласованный перечень позиций с ценами и условиями поставки.'],
  ['Поставка', 'После согласования и оплаты организуем отгрузку и передаём документы.'],
] as const

export default function AboutPage() {
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
              <span className="text-ink-2">О компании</span>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-[1180px] px-4 py-10 sm:py-14 lg:py-16">
          <section className="grid gap-10 border-b border-[var(--border)] pb-12 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)] lg:gap-20 lg:pb-16">
            <div>
              <p className="mb-4 text-sm font-semibold text-azure">Electromagaz</p>
              <h1 className="max-w-[16ch] text-[38px] font-bold leading-[1.02] tracking-[-0.045em] text-ink sm:text-[52px]">
                Компоненты для разработки и серийных проектов
              </h1>
              <p className="mt-6 max-w-[62ch] text-base leading-relaxed text-ink-3 sm:text-lg">
                Мы работаем с инженерами, отделами снабжения и компаниями, которым нужен точный подбор по маркировке, понятные условия и один ответ по всей спецификации.
              </p>
            </div>

            <aside className="border-l-2 border-azure pl-5 lg:self-end">
              <h2 className="text-sm font-semibold text-ink">Когда мы полезны</h2>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink-3">
                <li>Нужно найти конкретный компонент по MPN.</li>
                <li>В спецификации несколько производителей и корпусов.</li>
                <li>Нужно согласовать аналоги до закупки.</li>
                <li>Для поставки важен комплект документов.</li>
              </ul>
            </aside>
          </section>

          <section className="py-12 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-16">
              <div>
                <h2 className="text-2xl font-bold tracking-[-0.03em] text-ink">Что делаем</h2>
                <p className="mt-3 text-sm leading-relaxed text-ink-3">
                  Только действия, которые можно проверить в каталоге и в коммерческом предложении.
                </p>
              </div>
              <dl className="border-t border-[var(--border)]">
                {capabilities.map((item) => (
                  <div key={item.title} className="grid gap-2 border-b border-[var(--border)] py-5 sm:grid-cols-[190px_minmax(0,1fr)] sm:gap-8">
                    <dt className="font-semibold text-ink">{item.title}</dt>
                    <dd className="text-sm leading-relaxed text-ink-3">{item.description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          <section className="border-y border-[var(--border)] py-12 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-16">
              <div>
                <h2 className="text-2xl font-bold tracking-[-0.03em] text-ink">Как проходит заказ</h2>
                <p className="mt-3 text-sm leading-relaxed text-ink-3">
                  Один последовательный процесс от списка позиций до отгрузки.
                </p>
              </div>
              <ol className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
                {process.map(([title, description], index) => (
                  <li key={title} className="border-t border-[var(--border)] pt-4">
                    <div className="font-mono text-xs text-azure">{String(index + 1).padStart(2, '0')}</div>
                    <h3 className="mt-3 font-semibold text-ink">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-3">{description}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  )
}
