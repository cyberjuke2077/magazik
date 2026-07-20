import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface SectionHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  href?: string
  linkLabel?: string
  align?: 'left' | 'center'
}

/** Единый заголовок секции: eyebrow + крупный title + опц. lead + ссылка «смотреть все». */
export function SectionHeader({
  eyebrow,
  title,
  description,
  href,
  linkLabel = 'Смотреть все',
  align = 'left',
}: SectionHeaderProps) {
  const centered = align === 'center'
  return (
    <div
      className={`mb-3 flex flex-col gap-3 ${
        centered ? 'items-center text-center' : 'md:flex-row md:items-end md:justify-between'
      }`}
    >
      <div className="max-w-2xl">
        {eyebrow && <div className="ui-eyebrow mb-2">{eyebrow}</div>}
        <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">{title}</h2>
        {description && <p className="mt-2 max-w-[65ch] text-sm text-ink-3">{description}</p>}
      </div>
      {href && !centered && (
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-azure hover:underline group"
        >
          {linkLabel}
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  )
}
