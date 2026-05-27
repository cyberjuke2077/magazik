import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  limit: number
  baseParams: string
}

function buildHref(baseParams: string, page: number): string {
  const params = new URLSearchParams(baseParams)
  if (page > 1) {
    params.set('page', String(page))
  } else {
    params.delete('page')
  }
  const qs = params.toString()
  return `/catalog${qs ? `?${qs}` : ''}`
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | '...')[] = [1]

  if (current > 3) {
    pages.push('...')
  }

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (current < total - 2) {
    pages.push('...')
  }

  pages.push(total)
  return pages
}

export function Pagination({ page, totalPages, total, limit, baseParams }: PaginationProps) {
  if (totalPages <= 1) return null

  const start = (page - 1) * limit + 1
  const end = Math.min(page * limit, total)
  const pages = getPageNumbers(page, totalPages)

  return (
    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
      {/* Range display */}
      <div className="text-sm text-gray-500">
        {start.toLocaleString('ru-RU')}–{end.toLocaleString('ru-RU')} из{' '}
        {total.toLocaleString('ru-RU')}
      </div>

      {/* Page buttons */}
      <div className="flex items-center gap-0 border border-gray-200">
        {/* Prev */}
        {page > 1 ? (
          <Link
            href={buildHref(baseParams, page - 1)}
            className="flex items-center justify-center w-9 h-9 text-gray-500 hover:bg-gray-50 border-r border-gray-200 transition-colors"
          >
            <ChevronLeft size={14} />
          </Link>
        ) : (
          <span className="flex items-center justify-center w-9 h-9 text-gray-300 border-r border-gray-200">
            <ChevronLeft size={14} />
          </span>
        )}

        {/* Page numbers */}
        {pages.map((p, idx) =>
          p === '...' ? (
            <span
              key={`dots-${idx}`}
              className="flex items-center justify-center w-9 h-9 text-sm text-gray-400 border-r border-gray-200"
            >
              …
            </span>
          ) : (
            <Link
              key={p}
              href={buildHref(baseParams, p)}
              className={`flex items-center justify-center w-9 h-9 text-sm font-medium border-r border-gray-200 transition-colors ${
                p === page
                  ? 'bg-[#0066cc] text-white'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {p}
            </Link>
          ),
        )}

        {/* Next */}
        {page < totalPages ? (
          <Link
            href={buildHref(baseParams, page + 1)}
            className="flex items-center justify-center w-9 h-9 text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <ChevronRight size={14} />
          </Link>
        ) : (
          <span className="flex items-center justify-center w-9 h-9 text-gray-300">
            <ChevronRight size={14} />
          </span>
        )}
      </div>
    </div>
  )
}
