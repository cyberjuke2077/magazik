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
      className="h-8 px-2 pr-7 text-sm text-gray-700 bg-white border border-gray-200 rounded cursor-pointer hover:border-gray-300 focus:outline-none focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc]/20 transition-colors appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_6px_center] bg-no-repeat"
    >
      {SORT_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
