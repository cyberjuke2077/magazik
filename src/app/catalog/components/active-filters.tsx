import Link from 'next/link'
import { X } from 'lucide-react'

interface ActiveFiltersProps {
  categoryName: string | null
  categorySlug: string | null
  manufacturerName: string | null
  manufacturerSlug: string | null
  query: string | null
  sort: string
}

function buildHrefWithout(
  params: ActiveFiltersProps,
  exclude: 'category' | 'manufacturer' | 'query' | 'sort',
): string {
  const sp = new URLSearchParams()
  if (exclude !== 'query' && params.query) sp.set('q', params.query)
  if (exclude !== 'category' && params.categorySlug) sp.set('category', params.categorySlug)
  if (exclude !== 'manufacturer' && params.manufacturerSlug) sp.set('manufacturer', params.manufacturerSlug)
  if (exclude !== 'sort' && params.sort !== 'date') sp.set('sort', params.sort)
  const qs = sp.toString()
  return `/catalog${qs ? `?${qs}` : ''}`
}

export function ActiveFilters(props: ActiveFiltersProps) {
  const { categoryName, manufacturerName, query, sort } = props

  const hasFilters = !!(categoryName || manufacturerName || query || sort !== 'date')

  if (!hasFilters) return null

  const sortLabels: Record<string, string> = {
    name: 'По названию А-Я',
    partNumber: 'По артикулу A-Z',
    manufacturer: 'По производителю',
  }

  return (
    <div className="flex items-center flex-wrap gap-2 mb-3">
      {query && (
        <Tag
          label={`Поиск: ${query}`}
          href={buildHrefWithout(props, 'query')}
        />
      )}
      {categoryName && (
        <Tag
          label={categoryName}
          href={buildHrefWithout(props, 'category')}
        />
      )}
      {manufacturerName && (
        <Tag
          label={manufacturerName}
          href={buildHrefWithout(props, 'manufacturer')}
        />
      )}
      {sort !== 'date' && sortLabels[sort] && (
        <Tag
          label={sortLabels[sort]}
          href={buildHrefWithout(props, 'sort')}
        />
      )}
      <Link
        href="/catalog"
        className="text-xs text-gray-400 hover:text-[#0066cc] transition-colors ml-1"
      >
        Сбросить всё
      </Link>
    </div>
  )
}

function Tag({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 h-6 px-2 text-xs text-[#0066cc] bg-[#e8f4ff] rounded hover:bg-[#d0e8ff] transition-colors"
    >
      <span className="max-w-[160px] truncate">{label}</span>
      <X size={12} className="shrink-0 opacity-60" />
    </Link>
  )
}
