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
    <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-[var(--border)] pt-4 sm:flex-row">
      {/* Range display */}
      <div className="text-sm text-ink-3 tnum">
        {start.toLocaleString('ru-RU')}-{end.toLocaleString('ru-RU')} из{' '}
        {total.toLocaleString('ru-RU')}
      </div>

      {/* Page buttons */}
      <div className="flex items-center gap-0 overflow-hidden rounded-[var(--radius-control)] border border-[var(--border)] bg-white">
        {/* Prev */}
        {page > 1 ? (
          <Link
            href={buildHref(baseParams, page - 1)}
            className="flex items-center justify-center w-9 h-9 text-ink-3 hover:bg-[#fafafa] border-r border-[var(--border)] transition-colors"
          >
            <ChevronLeft size={14} />
          </Link>
        ) : (
          <span className="flex items-center justify-center w-9 h-9 text-ink-4 border-r border-[var(--border)]">
            <ChevronLeft size={14} />
          </span>
        )}

        {/* Page numbers */}
        {pages.map((p, idx) =>
          p === '...' ? (
            <span
              key={`dots-${idx}`}
              className="flex items-center justify-center w-9 h-9 text-sm text-ink-4 border-r border-[var(--border)]"
            >
              …
            </span>
          ) : (
            <Link
              key={p}
              href={buildHref(baseParams, p)}
              className={`flex items-center justify-center w-9 h-9 text-sm font-medium border-r border-[var(--border)] transition-colors ${
                p === page
                  ? 'bg-azure text-white'
                  : 'text-ink-3 hover:bg-[#fafafa] hover:text-ink'
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
            className="flex items-center justify-center w-9 h-9 text-ink-3 hover:bg-[#fafafa] transition-colors"
          >
            <ChevronRight size={14} />
          </Link>
        ) : (
          <span className="flex items-center justify-center w-9 h-9 text-ink-4">
            <ChevronRight size={14} />
          </span>
        )}
      </div>
    </div>
  )
}
