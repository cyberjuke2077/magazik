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
    title: '14 дней',
    desc: 'Срок для уведомления о браке с момента получения товара',
  },
  {
    icon: FileCheck,
    title: 'Заводская упаковка',
    desc: 'Возврат принимается только в оригинальной упаковке без следов вскрытия и эксплуатации',
  },
  {
    icon: ArrowLeftRight,
    title: 'Все документы',
    desc: 'УПД, накладная, акт о выявленных недостатках - обязательны',
  },
  {
    icon: AlertTriangle,
    title: 'Только брак',
    desc: 'Товар надлежащего качества возврату не подлежит (B2B-условия)',
  },
]

const steps = [
  {
    n: 1,
    title: 'Свяжитесь с менеджером',
    desc: 'Напишите на returns@electromagaz.ru или позвоните по телефону. Опишите проблему и приложите фото/видео дефекта.',
  },
  {
    n: 2,
    title: 'Составьте акт',
    desc: 'Менеджер пришлёт форму акта о выявленных недостатках. Заполните, подпишите и отсканируйте.',
  },
  {
    n: 3,
    title: 'Отправьте товар',
    desc: 'После согласования направьте товар по адресу склада в оригинальной упаковке. Отправку оплачивает покупатель, при подтверждённом браке - компенсируем.',
  },
  {
    n: 4,
    title: 'Экспертиза',
    desc: 'Проводим входной контроль и экспертизу. Срок - до 10 рабочих дней.',
  },
  {
    n: 5,
    title: 'Возврат средств или замена',
    desc: 'При подтверждении брака возвращаем оплату на расчётный счёт или производим замену по согласованию.',
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

          <section className="mb-10 grid lg:grid-cols-2 gap-3">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-amber-700" />
                <h3 className="text-sm font-bold text-ink">Возврату не подлежат</h3>
              </div>
              <ul className="space-y-1.5 text-sm text-ink-3 leading-relaxed">
                <li>- Товары без видимых дефектов, соответствующие заказу</li>
                <li>- Изделия со следами монтажа, пайки, эксплуатации</li>
                <li>- Компоненты, заказанные под индивидуальный проект (custom-orders)</li>
                <li>- Товары с истёкшим сроком уведомления (более 14 дней)</li>
              </ul>
            </div>
            <div className="rounded-2xl bg-azure-light p-6">
              <div className="flex items-center gap-2 mb-3">
                <FileCheck size={16} className="text-azure" />
                <h3 className="text-sm font-bold text-ink">Гарантия</h3>
              </div>
              <p className="text-sm text-ink-3 leading-relaxed mb-2">
                Гарантия на электронные компоненты - 12 месяцев с даты поставки, если иное не
                указано в спецификации производителя.
              </p>
              <p className="text-sm text-ink-3 leading-relaxed">
                Гарантийные случаи рассматриваются в индивидуальном порядке после экспертизы.
              </p>
            </div>
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
