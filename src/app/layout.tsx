import type { Metadata } from 'next'
import { Suspense } from 'react'
import './globals.css'
import { ToastProvider } from '@/components/ui/toast'
import { ScrollToTop } from '@/components/ui/scroll-to-top'
import { NavProgress } from '@/components/ui/nav-progress'
import { CompareBar } from '@/components/catalog/compare-bar'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://electromagaz.ru'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Electromagaz — электронные компоненты',
    template: '%s | Electromagaz',
  },
  description:
    'Каталог электронных компонентов для бизнеса: поиск по MPN, подбор позиций и запрос коммерческого предложения.',
  keywords: ['электронные компоненты', 'резисторы', 'конденсаторы', 'микросхемы', 'Arduino', 'STM32'],
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: SITE_URL,
    siteName: 'Electromagaz',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" data-scroll-behavior="smooth">
      <body className="min-h-screen bg-canvas antialiased">
        <a
          href="#main-content"
          className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white shadow-lg transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-azure focus:ring-offset-2"
        >
          К основному содержанию
        </a>
        <ToastProvider>
          <Suspense fallback={null}>
            <NavProgress />
          </Suspense>
          <div id="main-content" tabIndex={-1}>
            {children}
          </div>
          <CompareBar />
          <ScrollToTop />
        </ToastProvider>
      </body>
    </html>
  )
}
