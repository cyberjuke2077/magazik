import type { Metadata } from 'next'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'
import { CompareClient } from './compare-client'

export const metadata: Metadata = {
  title: 'Сравнение товаров',
  description: 'Сравнение характеристик электронных компонентов бок о бок.',
  robots: { index: false, follow: true },
}

export default function ComparePage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <StickyNav />
      <CompareClient />
      <Footer />
    </div>
  )
}
