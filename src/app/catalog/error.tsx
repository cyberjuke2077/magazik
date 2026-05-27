'use client'

import Link from 'next/link'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function CatalogError({ error, reset }: ErrorProps) {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <StickyNav />
      <main className="flex-1 flex items-center justify-center py-20">
        <div className="text-center max-w-sm mx-auto px-4">
          <div className="inline-flex items-center justify-center size-16 rounded bg-red-50 border border-red-100 mb-5">
            <AlertTriangle size={28} className="text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Ошибка загрузки каталога
          </h1>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            {error.message || 'Что-то пошло не так. Попробуйте обновить страницу.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={reset}
              className="flex items-center gap-2 h-10 px-5 text-sm font-medium text-white bg-[#0066cc] hover:bg-[#0052a3] rounded transition-all shadow-sm"
            >
              <RefreshCw size={14} />
              Попробовать снова
            </button>
            <Link
              href="/"
              className="flex items-center h-10 px-5 text-sm font-medium text-gray-600 bg-white border border-gray-300 hover:border-gray-400 rounded transition-all"
            >
              На главную
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
