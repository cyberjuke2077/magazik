import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, FileText, Layers3, Search, SlidersHorizontal } from 'lucide-react'

const serviceCards = [
  {
    icon: Search,
    href: '/catalog',
    title: 'Поиск по MPN',
    description: 'Точный артикул, корпус и производитель',
  },
  {
    icon: SlidersHorizontal,
    href: '/wholesale#request-form',
    title: 'Подбор аналогов',
    description: 'Совместимая замена для дефицитной позиции',
  },
  {
    icon: FileText,
    href: '/catalog',
    title: 'Документация',
    description: 'Характеристики, корпуса и datasheet',
  },
  {
    icon: Layers3,
    href: '/wholesale',
    title: 'Серийные поставки',
    description: 'Комплектация BOM и коммерческое предложение',
  },
]

export function HeroSlider() {
  return (
    <section className="storefront-container pt-5 sm:pt-7">
      <div className="storefront-hero relative isolate overflow-hidden rounded-3xl px-4 py-7 text-center sm:px-10 sm:py-14">
        <Image src="/storefront/hero-components.jpg" alt="" fill loading="eager" fetchPriority="high" sizes="(max-width: 1440px) 100vw, 1380px" className="pointer-events-none -z-20 object-cover object-center opacity-30" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,#edf4ff_30%,#edf4ffb8_75%,#edf4ff40)]" />
        <p className="mb-4 text-sm font-semibold text-azure">Электронные компоненты для инженеров и снабжения</p>
        <h1 className="mx-auto max-w-5xl text-[clamp(1.9rem,4.3vw,3.6rem)] font-bold leading-[1.08] tracking-[-0.045em] text-ink text-balance">
          От первого прототипа<br className="hidden sm:block" /> до серийного выпуска.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-ink-2 sm:text-base">Найдите нужный компонент по MPN или пришлите спецификацию. Проверим наличие, сроки и предложим аналоги.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2 sm:gap-3">
          <Link href="/catalog" className="hero-action inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-azure px-4 text-xs font-semibold text-white transition-colors hover:bg-azure-hover sm:px-6 sm:text-sm">В каталог <ArrowRight size={17} aria-hidden="true" /></Link>
          <Link href="/wholesale#request-form" className="hero-action inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--border)] bg-white px-4 text-xs font-semibold text-ink transition-colors hover:bg-surface-muted sm:px-6 sm:text-sm">Отправить список</Link>
        </div>
      </div>
      <div className="grid grid-flow-dense grid-cols-2 gap-px overflow-hidden rounded-b-2xl bg-[var(--border)] sm:mx-5 lg:grid-cols-4">
        {serviceCards.map(({ icon: Icon, ...card }) => (
          <Link key={card.title} href={card.href} className="group flex items-start gap-3 bg-white p-4 transition-colors hover:bg-azure-dim sm:p-5">
            <Icon size={21} strokeWidth={1.6} className="mt-0.5 hidden shrink-0 text-azure sm:block" aria-hidden="true" />
            <div><h2 className="text-sm font-semibold text-ink group-hover:text-azure">{card.title}</h2><p className="mt-1 text-xs leading-relaxed text-ink-3">{card.description}</p></div>
          </Link>
        ))}
      </div>
    </section>
  )
}
