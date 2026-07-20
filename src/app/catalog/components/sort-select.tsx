'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const SORT_OPTIONS = [
  { value: 'date', label: 'По дате (новые)' },
  { value: 'name', label: 'По названию А-Я' },
  { value: 'partNumber', label: 'По артикулу A-Z' },
  { value: 'manufacturer', label: 'По производителю' },
] as const

export function SortSelect() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSort = searchParams.get('sort') || 'date'

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString())
    const value = e.target.value
    if (value === 'date') {
      params.delete('sort')
    } else {
      params.set('sort', value)
    }
    // Reset page on sort change
    params.delete('page')
    const qs = params.toString()
    router.replace(`/catalog${qs ? `?${qs}` : ''}`)
  }

  return (
    <select
      value={currentSort}
      onChange={handleChange}
      className="h-8 cursor-pointer rounded-[var(--radius-control)] border border-[var(--border)] bg-white px-2 text-sm text-ink-2 transition-colors hover:border-azure/40 focus:border-azure focus:outline-none focus:ring-1 focus:ring-azure/20"
    >
      {SORT_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
