import type { Metadata } from 'next'
import { Geist_Mono, Onest, Wix_Madefor_Display } from 'next/font/google'
import { Suspense } from 'react'
import './globals.css'
import { ToastProvider } from '@/components/ui/toast'
import { ScrollToTop } from '@/components/ui/scroll-to-top'
import { NavProgress } from '@/components/ui/nav-progress'
import { CompareBar } from '@/components/catalog/compare-bar'

const onest = Onest({
  variable: '--font-onest',
  subsets: ['cyrillic', 'latin'],
  display: 'swap',
})

const wixMadeforDisplay = Wix_Madefor_Display({
  variable: '--font-wix-display',
  subsets: ['cyrillic', 'latin'],
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-code',
  subsets: ['latin'],
  display: 'swap',
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://electromagaz.ru'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Electromagaz — электронные компоненты',
    template: '%s | Electromagaz',
  },
  description:
    'Интернет-магазин электронных компонентов: резисторы, конденсаторы, микросхемы, датчики, контроллеры. Оптом и в розницу. Отправка в день заказа.',
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
    <html lang="ru" className={`${onest.variable} ${wixMadeforDisplay.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-canvas antialiased">
        <ToastProvider>
          <Suspense fallback={null}>
            <NavProgress />
          </Suspense>
          {children}
          <CompareBar />
          <ScrollToTop />
        </ToastProvider>
      </body>
    </html>
  )
}
