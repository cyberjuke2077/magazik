import Link from 'next/link'
import { ArrowRight, Search, Home, Package } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <StickyNav />

      <main className="flex-1 flex items-center justify-center py-20">
        <div className="mx-auto max-w-2xl rounded-2xl bg-white px-6 py-12 text-center shadow-sm">
          {/* 404 number with electronic chip aesthetic */}
          <div className="relative inline-block mb-8">
            <div className="text-[140px] md:text-[180px] font-extrabold text-azure leading-none tracking-tighter">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-[140px] md:text-[180px] font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-azure/0 to-white/40 leading-none tracking-tighter">
                404
              </div>
            </div>
            {/* Decorative dots */}
            <div className="absolute -top-2 -right-2 size-3 rounded-full bg-azure animate-pulse" />
            <div className="absolute -bottom-2 -left-2 size-2 rounded-full bg-azure animate-pulse" />
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Страница не найдена
          </h1>
          <p className="text-base text-gray-500 mb-8 leading-relaxed max-w-md mx-auto">
            Возможно, страница была перемещена, переименована или временно недоступна.
            Проверьте адрес или воспользуйтесь поиском.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
            <Link
              href="/"
              className="flex h-11 items-center gap-2 rounded-xl bg-azure px-6 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-azure-hover hover:shadow-md active:translate-y-0"
            >
              <Home size={14} />
              На главную
            </Link>
            <Link
              href="/catalog"
              className="flex h-11 items-center gap-2 rounded-xl border border-azure px-6 text-sm font-semibold text-azure transition-all hover:bg-azure-light"
            >
              <Package size={14} />
              В каталог
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Suggestions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 max-w-xl mx-auto pt-8 border-t border-gray-100">
            <Link
              href="/catalog?category=mikroskhemy"
              className="rounded-xl bg-canvas p-4 text-left transition-all hover:-translate-y-0.5 hover:bg-azure-light"
            >
              <Search size={14} className="text-azure mb-2" />
              <div className="text-xs font-bold text-gray-900">Микросхемы</div>
              <div className="text-xs text-gray-400 mt-0.5">Открыть категорию</div>
            </Link>
            <Link
              href="/catalog?category=rezistory"
              className="rounded-xl bg-canvas p-4 text-left transition-all hover:-translate-y-0.5 hover:bg-azure-light"
            >
              <Search size={14} className="text-azure mb-2" />
              <div className="text-xs font-bold text-gray-900">Резисторы</div>
              <div className="text-xs text-gray-400 mt-0.5">Открыть категорию</div>
            </Link>
            <Link
              href="/catalog?category=kontrollery"
              className="rounded-xl bg-canvas p-4 text-left transition-all hover:-translate-y-0.5 hover:bg-azure-light"
            >
              <Search size={14} className="text-azure mb-2" />
              <div className="text-xs font-bold text-gray-900">Контроллеры</div>
              <div className="text-xs text-gray-400 mt-0.5">Открыть категорию</div>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
