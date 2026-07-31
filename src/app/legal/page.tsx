import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'
import { COMPANY } from '@/lib/company'

export const metadata: Metadata = {
  title: 'Реквизиты и правовая информация',
  description:
    'Реквизиты компании, условия B2B-поставки, политика обработки персональных данных и условия работы Electromagaz.',
}

const requisites: { label: string; value: string }[] = [
  { label: 'Наименование', value: COMPANY.legalName },
  { label: 'ИНН', value: COMPANY.inn },
  { label: 'КПП', value: COMPANY.kpp },
  { label: 'ОГРН', value: COMPANY.ogrn },
  { label: 'Юридический адрес', value: COMPANY.legalAddress },
  { label: 'Телефон', value: COMPANY.phone.display },
  { label: 'Email', value: COMPANY.email },
]

const bankRequisites: { label: string; value: string }[] = [
  { label: 'Банк', value: COMPANY.bank.name },
  { label: 'БИК', value: COMPANY.bank.bic },
  { label: 'Расчётный счёт', value: COMPANY.bank.account },
  { label: 'Корр. счёт', value: COMPANY.bank.corrAccount },
]

const documents = [
  { title: 'Условия B2B-поставки', desc: 'Порядок формирования заявки и согласования сделки', href: '/offer' },
  { title: 'Политика обработки ПДн', desc: 'Обработка персональных данных по ФЗ-152', href: '/privacy' },
  { title: 'Условия использования', desc: 'Правила работы с сайтом', href: '/terms' },
  { title: 'Возврат и обмен', desc: 'Порядок возврата товара', href: '/returns' },
]

export default function LegalPage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Header />
      <StickyNav />

      <main className="flex-1">
        <div className="border-b border-[var(--border)]">
          <div className="mx-auto max-w-[1440px] px-3 py-2 sm:px-6">
            <nav className="flex items-center gap-1.5 text-xs text-ink-4">
              <Link href="/" className="hover:text-ink-3 transition-colors">Главная</Link>
              <span>›</span>
              <span className="text-ink-3">Реквизиты и правовая информация</span>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-[1080px] px-3 py-8 sm:px-6">
          <h1 className="mb-1 max-w-6xl text-3xl font-bold tracking-[-0.03em] text-ink">Реквизиты и правовая информация</h1>
          <p className="text-sm text-ink-3 mb-8">
            Реквизиты компании для заключения договоров и безналичной оплаты, а также правовые документы сайта.
          </p>

          {/* Реквизиты */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-ink mb-3">Реквизиты компании</h2>
            <div className="space-y-2.5 rounded-2xl bg-white p-6 text-sm shadow-sm">
              {requisites.map((r) => (
                <div key={r.label} className="flex justify-between gap-4">
                  <span className="text-ink-3 shrink-0">{r.label}</span>
                  <span className="text-ink font-medium text-right">{r.value}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Банковские реквизиты */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-ink mb-3">Банковские реквизиты</h2>
            <div className="space-y-2.5 rounded-2xl bg-white p-6 text-sm shadow-sm">
              {bankRequisites.map((r) => (
                <div key={r.label} className="flex justify-between gap-4">
                  <span className="text-ink-3 shrink-0">{r.label}</span>
                  <span className="text-ink font-medium text-right font-mono">{r.value}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-[var(--border)] text-xs text-ink-3">
                Счёт на оплату выставляется после согласования коммерческого предложения.
              </div>
            </div>
          </section>

          {/* Документы */}
          <section>
            <h2 className="text-lg font-bold text-ink mb-3">Правовые документы</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {documents.map((d) => (
                <Link
                  key={d.href}
                  href={d.href}
                  className="block rounded-2xl bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="font-semibold text-ink">{d.title}</div>
                  <div className="text-xs text-ink-3 mt-0.5">{d.desc}</div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
