'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { type ManufacturerWithCount } from '@/lib/queries/categories'

interface ManufacturerFilterProps {
  manufacturers: ManufacturerWithCount[]
  activeSlug: string | null
}

const INITIAL_VISIBLE = 10

export function ManufacturerFilter({ manufacturers, activeSlug }: ManufacturerFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [expanded, setExpanded] = useState(false)

  const filtered = searchTerm
    ? manufacturers.filter((m) =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : manufacturers

  const visible = expanded || searchTerm ? filtered : filtered.slice(0, INITIAL_VISIBLE)
  const hasMore = !searchTerm && filtered.length > INITIAL_VISIBLE

  function handleSelect(slug: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (slug === activeSlug) {
      params.delete('manufacturer')
    } else {
      params.set('manufacturer', slug)
    }
    params.delete('page')
    const qs = params.toString()
    router.replace(`/catalog${qs ? `?${qs}` : ''}`)
  }

  if (manufacturers.length === 0) return null

  return (
    <div className="mt-5">
      <div className="text-xs font-bold text-ink-3 uppercase tracking-wide px-2 mb-2">
        Производитель
      </div>

      {/* Search input */}
      {manufacturers.length > INITIAL_VISIBLE && (
        <div className="relative mb-2 px-2">
          <Search
            size={12}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-4"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Поиск..."
            className="w-full h-7 pl-6 pr-2 text-xs text-ink-2 bg-gray-50 border border-[var(--border)] rounded focus:outline-none focus:border-azure focus:bg-white transition-colors"
          />
        </div>
      )}

      {/* Manufacturer list */}
      <div className="space-y-0.5">
        {visible.map((m) => {
          const isActive = m.slug === activeSlug
          return (
            <div
              key={m.id}
              className={`flex items-center gap-2 py-1.5 px-2 cursor-pointer text-sm transition-colors rounded ${
                isActive
                  ? 'bg-azure-light text-azure font-semibold'
                  : 'text-ink-2 hover:bg-[#fafafa] hover:text-ink'
              }`}
              onClick={() => handleSelect(m.slug)}
            >
              <input
                type="checkbox"
                checked={isActive}
                readOnly
                className="w-3.5 h-3.5 shrink-0 rounded border-[var(--border-2)] text-azure focus:ring-0 cursor-pointer"
              />
              <span className="flex-1 truncate text-xs">{m.name}</span>
              <span className="text-[10px] text-ink-4 shrink-0">
                {m.productCount}
              </span>
            </div>
          )
        })}
      </div>

      {/* Show all / collapse */}
      {hasMore && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-1 px-2 text-xs text-azure hover:underline"
        >
          Показать все ({filtered.length})
        </button>
      )}
      {hasMore && expanded && (
        <button
          onClick={() => setExpanded(false)}
          className="mt-1 px-2 text-xs text-azure hover:underline"
        >
          Свернуть
        </button>
      )}

      {/* No results */}
      {filtered.length === 0 && searchTerm && (
        <div className="px-2 py-2 text-xs text-ink-4">
          Не найдено
        </div>
      )}
    </div>
  )
}
