import type { Metadata } from 'next'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'
import { AccountClient } from './account-client'

export const metadata: Metadata = {
  title: 'Ваши заявки',
  description: 'История заявок из этого браузера и ссылки на их статусы.',
  robots: { index: false, follow: false },
}

export default function AccountPage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Header />
      <StickyNav />
      <main className="flex-1">
        <AccountClient />
      </main>
      <Footer />
    </div>
  )
}
