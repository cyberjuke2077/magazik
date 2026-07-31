import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

const guides = [
  { title: 'Как проверить точный MPN', href: '/contacts' },
  { title: 'Подбор совместимого аналога', href: '/request-quote' },
  { title: 'Корпус и тип монтажа', href: '/catalog' },
  { title: 'Компоненты для серийного BOM', href: '/wholesale' },
  { title: 'Проверка сроков поставки', href: '/delivery' },
]

export function CatalogGuideStrip() {
  return (
    <nav
      className="no-scrollbar mb-3 flex overflow-x-auto rounded-[var(--radius-card)] border border-[var(--border)] bg-white"
      aria-label="Помощь с подбором"
      data-motion-reveal
    >
      {guides.map((guide) => (
        <Link
          key={guide.title}
          href={guide.href}
          className="group flex min-h-16 min-w-[190px] flex-1 items-center justify-between gap-3 border-r border-[var(--border)] px-4 py-3 text-sm font-medium leading-snug text-ink last:border-r-0 hover:bg-surface-muted"
        >
          {guide.title}
          <ArrowUpRight size={15} className="shrink-0 text-ink-4 transition-colors group-hover:text-azure" />
        </Link>
      ))}
    </nav>
  )
}
