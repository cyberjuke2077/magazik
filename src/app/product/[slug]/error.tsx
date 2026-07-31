'use client'

import Link from 'next/link'
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'

interface ErrorProps {
  reset: () => void
}

export default function ProductError({ reset }: ErrorProps) {
  return (
    <>
      <Header />
      <StickyNav />
      <main className="flex flex-1 items-center justify-center bg-canvas py-20">
        <div className="text-center max-w-sm mx-auto px-4">
          <div className="inline-flex items-center justify-center size-16 rounded bg-red-50 border border-red-100 mb-5">
            <AlertTriangle size={28} className="text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-ink mb-2">Ошибка загрузки товара</h1>
          <p className="text-sm text-ink-3 mb-6 leading-relaxed">
            Не удалось загрузить страницу товара. Попробуйте ещё раз или вернитесь в каталог.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={reset} className="ui-btn ui-btn-primary">
              <RefreshCw size={14} />
              Повторить
            </button>
            <Link href="/catalog" className="ui-btn ui-btn-secondary">
              <ArrowLeft size={14} />
              В каталог
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
