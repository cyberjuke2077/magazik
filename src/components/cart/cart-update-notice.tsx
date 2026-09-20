'use client'

import Link from 'next/link'
import type { CartChange } from '@/lib/cart-reconciliation'

interface CartUpdateNoticeProps {
  changes: CartChange[]
  error: string | null
  isRefreshing?: boolean
  onRetry: () => Promise<unknown>
  onDismiss?: () => void
}

export function CartUpdateNotice({
  changes, error, isRefreshing = false, onRetry, onDismiss,
}: CartUpdateNoticeProps) {
  if (!isRefreshing && !error && changes.length === 0) return null
  const title = isRefreshing
    ? 'Проверяем цены и минимальные партии'
    : error ? 'Актуальность корзины не проверена' : 'Условия в корзине обновлены'
  return (
    <section className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-ink-2" role="status">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-bold text-ink">{title}</h2>
          {error && <p className="mt-1">{error}</p>}
          <ul className="mt-2 space-y-1">
            {changes.map((change) => (
              <li key={`${change.type}-${change.productId}`}>
                {change.message}{' '}
                {change.searchHref && <Link href={change.searchHref} className="font-semibold text-azure hover:underline">Найти товар</Link>}
              </li>
            ))}
          </ul>
        </div>
        {error && <button onClick={() => void onRetry()} className="shrink-0 font-semibold text-azure hover:underline">Повторить</button>}
        {!error && !isRefreshing && onDismiss && (
          <button onClick={onDismiss} className="shrink-0 font-semibold text-azure hover:underline">Понятно</button>
        )}
      </div>
    </section>
  )
}
