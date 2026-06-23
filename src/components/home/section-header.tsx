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
      className={`mb-10 flex flex-col gap-5 ${
        centered ? 'items-center text-center' : 'md:flex-row md:items-end md:justify-between'
      }`}
    >
      <div className="max-w-2xl">
        {eyebrow && <div className="ui-eyebrow mb-3">{eyebrow}</div>}
        <h2 className="section-heading text-balance">{title}</h2>
        {description && <p className="text-lead mt-4">{description}</p>}
      </div>
      {href && !centered && (
        <Link
          href={href}
          className="ui-btn ui-btn-secondary shrink-0 group"
        >
          {linkLabel}
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  )
}
