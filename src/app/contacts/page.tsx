import type { Metadata } from 'next'
import Link from 'next/link'
import { Phone, Mail, MapPin, Clock, MessageCircle, Send } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'
import { COMPANY } from '@/lib/company'

export const metadata: Metadata = {
  title: 'Контакты',
  description:
    'Контакты Electromagaz: телефон, email, адрес офиса, режим работы. Связаться с менеджером для оформления заказа.',
}

const departments = [
  {
    title: 'Отдел продаж',
    desc: 'Запросы КП, оформление заказов, работа с BOM',
    phone: COMPANY.phone.display,
    email: COMPANY.salesEmail,
  },
  {
    title: 'Техническая поддержка',
    desc: 'Подбор аналогов, технические вопросы, datasheets',
    phone: COMPANY.phone.display,
    email: COMPANY.supportEmail,
  },
  {
    title: 'Бухгалтерия',
    desc: 'Документы, акты сверки, оплата',
    phone: COMPANY.phone.display,
    email: COMPANY.accountingEmail,
  },
]

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
            Свяжитесь с нами удобным способом - ответим в течение 24 часов в рабочие дни
          </p>

          <div className="mb-6 grid gap-3 lg:grid-cols-3">
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
              <p className="text-xs text-ink-3">Звонок по России бесплатный</p>
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
              <p className="text-xs text-ink-3">Ответим в течение 24 часов</p>
            </div>

            {/* Schedule */}
            <div className="rounded-2xl bg-white p-5 shadow-[var(--shadow-xs)]">
              <div className="flex size-10 items-center justify-center bg-azure-light mb-4 rounded">
                <Clock size={18} className="text-azure" />
              </div>
              <div className="text-xs text-ink-3 mb-1">Режим работы</div>
              <div className="text-lg font-bold text-ink mb-1">Пн-Пт 9:00-18:00</div>
              <p className="text-xs text-ink-3">Сб, Вс - выходные</p>
            </div>
          </div>

          {/* Address */}
          <section className="mb-8 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl bg-white p-5 shadow-[var(--shadow-xs)]">
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={18} className="text-azure" />
                <h2 className="text-base font-bold text-ink">Офис и склад</h2>
              </div>
              <div className="text-sm text-ink-3 leading-relaxed mb-4">
                <div className="font-semibold text-ink mb-1">г. Москва</div>
                <div>{COMPANY.legalAddress}</div>
              </div>
              <div className="text-xs text-ink-3 leading-relaxed pt-3 border-t border-[var(--border)]">
                Самовывоз доступен по предварительной заявке. Согласовывайте время с менеджером
                заранее, чтобы заказ был готов к выдаче.
              </div>
            </div>

            <div className="rounded-2xl bg-azure-light p-5">
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle size={18} className="text-azure" />
                <h2 className="text-base font-bold text-ink">Мессенджеры</h2>
              </div>
              <div className="space-y-2.5 text-sm">
                <a
                  href={COMPANY.messengers.telegram}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-xl bg-white p-3 transition-colors duration-200 hover:bg-surface-muted"
                >
                  <Send size={16} className="text-[#0088cc]" />
                  <div>
                    <div className="font-semibold text-ink">Telegram</div>
                    <div className="text-xs text-ink-3">@electromagaz</div>
                  </div>
                </a>
                <a
                  href={`https://wa.me/${COMPANY.phone.raw.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-xl bg-white p-3 transition-colors duration-200 hover:bg-surface-muted"
                >
                  <MessageCircle size={16} className="text-[#25D366]" />
                  <div>
                    <div className="font-semibold text-ink">WhatsApp</div>
                    <div className="text-xs text-ink-3">{COMPANY.phone.display}</div>
                  </div>
                </a>
              </div>
            </div>
          </section>

          {/* Departments */}
          <section>
            <h2 className="text-xl font-bold text-ink mb-5">Отделы</h2>
            <div className="grid md:grid-cols-3 gap-3">
              {departments.map((d) => (
                <div key={d.title} className="rounded-2xl bg-white p-5 shadow-[var(--shadow-xs)]">
                  <h3 className="text-sm font-bold text-ink mb-1">{d.title}</h3>
                  <p className="text-xs text-ink-3 mb-4 leading-relaxed">{d.desc}</p>
                  <div className="space-y-1.5 text-xs">
                    <a
                      href={`tel:${d.phone.replace(/\D/g, '')}`}
                      className="flex items-center gap-1.5 text-ink-2 hover:text-azure transition-colors"
                    >
                      <Phone size={11} className="text-azure" />
                      {d.phone}
                    </a>
                    <a
                      href={`mailto:${d.email}`}
                      className="flex items-center gap-1.5 text-ink-2 hover:text-azure transition-colors"
                    >
                      <Mail size={11} className="text-azure" />
                      {d.email}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
