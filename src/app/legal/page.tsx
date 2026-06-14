import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'
import { COMPANY } from '@/lib/company'

export const metadata: Metadata = {
  title: 'Реквизиты и правовая информация',
  description:
    'Реквизиты компании, публичная оферта, политика обработки персональных данных и условия работы Electromagaz.',
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
  { title: 'Публичная оферта', desc: 'Условия поставки электронных компонентов', href: '/offer' },
  { title: 'Политика обработки ПДн', desc: 'Обработка персональных данных по ФЗ-152', href: '/privacy' },
  { title: 'Условия использования', desc: 'Правила работы с сайтом', href: '/terms' },
  { title: 'Возврат и обмен', desc: 'Порядок возврата товара', href: '/returns' },
]

export default function LegalPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <StickyNav />

      <main className="flex-1">
        <div className="border-b border-gray-100">
          <div className="mx-auto max-w-[1400px] px-4 py-2.5">
            <nav className="flex items-center gap-1.5 text-xs text-gray-400">
              <Link href="/" className="hover:text-gray-600 transition-colors">Главная</Link>
              <span>›</span>
              <span className="text-gray-600">Реквизиты и правовая информация</span>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-[900px] px-4 py-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Реквизиты и правовая информация</h1>
          <p className="text-sm text-gray-500 mb-8">
            Реквизиты компании для заключения договоров и безналичной оплаты, а также правовые документы сайта.
          </p>

          {/* Реквизиты */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Реквизиты компании</h2>
            <div className="p-5 bg-gray-50 border border-gray-200 rounded space-y-2.5 text-sm">
              {requisites.map((r) => (
                <div key={r.label} className="flex justify-between gap-4">
                  <span className="text-gray-500 shrink-0">{r.label}</span>
                  <span className="text-gray-900 font-medium text-right">{r.value}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Банковские реквизиты */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Банковские реквизиты</h2>
            <div className="p-5 bg-gray-50 border border-gray-200 rounded space-y-2.5 text-sm">
              {bankRequisites.map((r) => (
                <div key={r.label} className="flex justify-between gap-4">
                  <span className="text-gray-500 shrink-0">{r.label}</span>
                  <span className="text-gray-900 font-medium text-right font-mono">{r.value}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-gray-200 text-xs text-gray-500">
                Счёт на оплату выставляется после согласования коммерческого предложения.
              </div>
            </div>
          </section>

          {/* Документы */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Правовые документы</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {documents.map((d) => (
                <Link
                  key={d.href}
                  href={d.href}
                  className="block p-4 border border-gray-200 rounded hover:border-[#0066cc] hover:shadow-sm transition-all"
                >
                  <div className="font-semibold text-gray-900">{d.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{d.desc}</div>
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
