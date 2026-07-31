import Link from 'next/link'
import { ArrowRight, Home, Package } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Header />
      <StickyNav />

      <main className="flex flex-1 items-center py-20">
        <div className="mx-auto w-full max-w-[1380px] px-4 lg:px-0">
          <div className="max-w-2xl border-l-2 border-azure py-4 pl-6 sm:pl-10">
            <div className="mpn text-sm font-semibold text-azure">Ошибка 404</div>
            <h1 className="mt-4 text-balance text-[42px] font-bold leading-[1.05] tracking-[-0.045em] text-ink sm:text-[56px]">
              Страница не найдена
            </h1>
            <p className="mt-5 max-w-[56ch] text-base leading-relaxed text-ink-3">
              Адрес мог измениться. Перейдите на главную или найдите нужный компонент в каталоге.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/" className="ui-btn ui-btn-primary">
                <Home size={16} />
                На главную
              </Link>
              <Link href="/catalog" className="ui-btn ui-btn-secondary">
                <Package size={16} />
                Открыть каталог
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
