import Link from 'next/link'
import { CheckCircle, ArrowRight } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'

interface SuccessPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function SubmitSuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams
  const requestId = (Array.isArray(params.id) ? params.id[0] : params.id) || '—'

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <StickyNav />

      <main className="flex-1 bg-gray-50 py-20">
        <div className="mx-auto max-w-2xl px-4">
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            {/* Success icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-50 mb-6">
              <CheckCircle size={48} className="text-green-500" />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Спасибо! Ваш запрос отправлен
            </h1>

            {/* Request ID */}
            <div className="inline-block px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg mb-6">
              <p className="text-sm text-blue-800">
                Номер запроса: <span className="font-bold">{requestId}</span>
              </p>
            </div>

            {/* Description */}
            <p className="text-gray-600 mb-8 leading-relaxed">
              Мы получили ваш запрос и свяжемся с вами в ближайшее время
              для согласования цены и сроков поставки.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/catalog"
                className="inline-flex items-center justify-center gap-2 h-11 px-6 text-sm font-semibold text-white bg-[#0066cc] hover:bg-[#0052a3] rounded transition-colors"
              >
                Вернуться в каталог
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
