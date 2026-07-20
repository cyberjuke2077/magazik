import type { Metadata } from 'next'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'
import { AccountClient } from './account-client'

export const metadata: Metadata = {
  title: 'Личный кабинет',
  description: 'Вход и регистрация в личном кабинете Electromagaz.',
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
