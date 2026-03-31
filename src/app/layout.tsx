import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'Electromagaz — электронные компоненты',
    template: '%s | Electromagaz',
  },
  description:
    'Интернет-магазин электронных компонентов: резисторы, конденсаторы, микросхемы, датчики, контроллеры. Оптом и в розницу. Отправка в день заказа.',
  keywords: ['электронные компоненты', 'резисторы', 'конденсаторы', 'микросхемы', 'Arduino', 'STM32'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  )
}
