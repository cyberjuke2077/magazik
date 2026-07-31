import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeftRight, Clock, FileCheck, AlertTriangle, ChevronRight } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'
import { COMPANY } from '@/lib/company'

export const metadata: Metadata = {
  title: 'Возврат товара',
  description:
    'Условия и порядок возврата электронных компонентов в Electromagaz: сроки, документы, контактные данные.',
}

const conditions = [
  {
    icon: Clock,
    title: 'Сообщите сразу',
    desc: 'Срок обращения определяется документами конкретной поставки',
  },
  {
    icon: FileCheck,
    title: 'Сохраните товар',
    desc: 'Не изменяйте состояние товара и упаковки до согласования проверки',
  },
  {
    icon: ArrowLeftRight,
    title: 'Приложите данные',
    desc: 'Номер заказа, MPN, количество, описание и фото помогают проверить обращение',
  },
  {
    icon: AlertTriangle,
    title: 'По условиям сделки',
    desc: 'Основание возврата или замены проверяется по согласованным документам',
  },
]

const steps = [
  {
    n: 1,
    title: 'Направьте обращение',
    desc: `Напишите на ${COMPANY.email}. Укажите номер заказа, контактное лицо и описание ситуации.`,
  },
  {
    n: 2,
    title: 'Приложите материалы',
    desc: 'Добавьте MPN, количество, фото упаковки и товара, а также документы поставки, если они доступны.',
  },
  {
    n: 3,
    title: 'Дождитесь инструкции',
    desc: 'Не отправляйте товар без подтверждённого адреса, получателя и способа передачи.',
  },
  {
    n: 4,
    title: 'Получите результат',
    desc: 'Дальнейшие действия и сроки сообщаются после проверки основания и документов сделки.',
  },
]

export default function ReturnsPage() {
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
              <span className="text-ink-3">Возврат товара</span>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-[1380px] px-4 py-7 lg:px-0">
          <h1 className="mb-1 text-3xl font-bold tracking-[-0.035em] text-ink">Возврат товара</h1>
          <p className="text-sm text-ink-3 mb-8 max-w-3xl">
            Работаем с юридическими лицами в B2B-режиме. Возврат осуществляется в соответствии с
            условиями договора поставки и Гражданским кодексом РФ.
          </p>

          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
            {conditions.map((c) => (
              <div key={c.title} className="rounded-2xl bg-white p-5 shadow-[var(--shadow-xs)]">
                <div className="flex size-9 items-center justify-center bg-azure-light mb-3 rounded">
                  <c.icon size={16} className="text-azure" />
                </div>
                <h3 className="text-sm font-bold text-ink mb-1">{c.title}</h3>
                <p className="text-xs text-ink-3 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-bold text-ink mb-5">Порядок возврата</h2>
            <div className="space-y-3">
              {steps.map((s) => (
                <div
                  key={s.n}
                  className="flex gap-4 rounded-2xl bg-white p-5 shadow-[var(--shadow-xs)]"
                >
                  <div className="flex size-9 items-center justify-center bg-azure text-white text-sm font-bold rounded shrink-0">
                    {s.n}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ink mb-1">{s.title}</h3>
                    <p className="text-sm text-ink-3 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-10 rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} className="text-amber-700" />
              <h3 className="text-sm font-bold text-ink">Важно до отправки товара</h3>
            </div>
            <p className="text-sm text-ink-3 leading-relaxed">
              Публичная страница не устанавливает единый срок, гарантию или безусловное право
              на возврат для всех B2B-поставок. Применяются условия конкретной сделки и
              законодательство РФ. Адрес и способ передачи необходимо получить у менеджера.
            </p>
          </section>

          <Link
            href="/contacts"
            className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-azure px-6 text-sm font-bold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-azure-hover active:translate-y-0"
          >
            Связаться с компанией
            <ChevronRight size={14} />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
