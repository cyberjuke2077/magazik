import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeftRight, Clock, FileCheck, AlertTriangle, ChevronRight } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'

export const metadata: Metadata = {
  title: 'Возврат товара',
  description:
    'Условия и порядок возврата электронных компонентов в Electromagaz: сроки, документы, контактные данные.',
}

const conditions = [
  {
    icon: Clock,
    title: 'Срок обращения',
    desc: 'Определяется условиями конкретной поставки и применимым законодательством',
  },
  {
    icon: FileCheck,
    title: 'Состояние товара',
    desc: 'Сохраните упаковку, маркировку и сведения о состоянии товара для рассмотрения обращения',
  },
  {
    icon: ArrowLeftRight,
    title: 'Документы',
    desc: 'Перечень необходимых документов менеджер сообщит после получения обращения',
  },
  {
    icon: AlertTriangle,
    title: 'Условия поставки',
    desc: 'Основания и порядок возврата определяются договором и применимым законодательством',
  },
]

const steps = [
  {
    n: 1,
    title: 'Свяжитесь с менеджером',
    desc: 'Используйте контакты компании, укажите номер поставки, опишите проблему и приложите доступные материалы.',
  },
  {
    n: 2,
    title: 'Получите порядок действий',
    desc: 'Менеджер уточнит необходимые документы и дальнейшие действия для рассмотрения обращения.',
  },
  {
    n: 3,
    title: 'Согласуйте передачу товара',
    desc: 'Не отправляйте товар до согласования адреса, способа передачи и распределения расходов.',
  },
  {
    n: 4,
    title: 'Рассмотрение',
    desc: 'Срок и способ проверки сообщаются после получения обращения и необходимых материалов.',
  },
  {
    n: 5,
    title: 'Возврат средств или замена',
    desc: 'Возможный способ урегулирования согласуется по результатам рассмотрения и с учётом условий поставки.',
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
              Свяжитесь с менеджером и дождитесь согласованного порядка действий. Гарантийные условия,
              сроки обращения и возможные способы урегулирования зависят от конкретной поставки.
            </p>
          </section>

          <Link
            href="/contacts"
            className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-azure px-6 text-sm font-bold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-azure-hover active:translate-y-0"
          >
            Связаться с отделом возвратов
            <ChevronRight size={14} />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
