import type { Metadata } from 'next'
import Link from 'next/link'
import { Phone, Mail, MapPin } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'
import { COMPANY } from '@/lib/company'

export const metadata: Metadata = {
  title: 'Контакты',
  description:
    'Контакты Electromagaz: телефон, email, адрес офиса, режим работы. Связаться с менеджером для оформления заказа.',
}

export default function ContactsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Header />
      <StickyNav />

      <main className="flex-1">
        <div className="border-b border-[var(--border)]">
          <div className="mx-auto max-w-[1380px] px-4 py-2 lg:px-0">
            <nav className="flex items-center gap-1.5 text-xs text-ink-4">
              <Link href="/" className="hover:text-ink-3 transition-colors">Главная</Link>
              <span>›</span>
              <span className="text-ink-3">Контакты</span>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-[1380px] px-4 py-7 lg:px-0">
          <h1 className="mb-1 text-3xl font-bold tracking-[-0.035em] text-ink">Контакты</h1>
          <p className="mb-5 text-sm text-ink-3">
            Используйте подтверждённые контакты для заявок, документов и вопросов по каталогу
          </p>

          <div className="mb-6 grid gap-3 lg:grid-cols-2" data-motion-reveal>
            {/* Phone */}
            <div className="rounded-2xl bg-white p-5 shadow-[var(--shadow-xs)]">
              <div className="flex size-10 items-center justify-center bg-azure-light mb-4 rounded">
                <Phone size={18} className="text-azure" />
              </div>
              <div className="text-xs text-ink-3 mb-1">Телефон</div>
              <a
                href={`tel:${COMPANY.phone.raw}`}
                className="block text-lg font-bold text-ink hover:text-azure mb-1 transition-colors"
              >
                {COMPANY.phone.display}
              </a>
              <p className="text-xs text-ink-3">Мобильный телефон</p>
            </div>

            {/* Email */}
            <div className="rounded-2xl bg-white p-5 shadow-[var(--shadow-xs)]">
              <div className="flex size-10 items-center justify-center bg-azure-light mb-4 rounded">
                <Mail size={18} className="text-azure" />
              </div>
              <div className="text-xs text-ink-3 mb-1">Email</div>
              <a
                href={`mailto:${COMPANY.email}`}
                className="block text-lg font-bold text-ink hover:text-azure mb-1 transition-colors"
              >
                {COMPANY.email}
              </a>
              <p className="text-xs text-ink-3">Единый адрес для обращений</p>
            </div>
          </div>

          {/* Address */}
          <section className="mb-8">
            <div className="rounded-2xl bg-white p-5 shadow-[var(--shadow-xs)]">
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={18} className="text-azure" />
                <h2 className="text-base font-bold text-ink">Юридический адрес</h2>
              </div>
              <div className="text-sm text-ink-3 leading-relaxed">
                <div>{COMPANY.legalAddress}</div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
