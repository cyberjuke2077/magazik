'use client'

import Link from 'next/link'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorProps {
  reset: () => void
}

export default function StorefrontError({ reset }: ErrorProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-20">
      <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-[var(--shadow-xs)]">
        <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-xl border border-red-100 bg-red-50">
          <AlertTriangle size={28} className="text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-ink">Не удалось загрузить страницу</h1>
        <p className="mt-2 text-sm leading-6 text-ink-3">
          Повторите попытку. Если проблема сохраняется, вернитесь на главную страницу.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="ui-btn ui-btn-primary">
            <RefreshCw size={14} />
            Попробовать снова
          </button>
          <Link href="/" className="ui-btn ui-btn-secondary">
            На главную
          </Link>
        </div>
      </div>
    </main>
  )
}
