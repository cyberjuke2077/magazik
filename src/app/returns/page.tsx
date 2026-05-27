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
    desc: 'УПД, накладная, акт о выявленных недостатках — обязательны',
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
    desc: 'После согласования направьте товар по адресу склада в оригинальной упаковке. Отправку оплачивает покупатель, при подтверждённом браке — компенсируем.',
  },
  {
    n: 4,
    title: 'Экспертиза',
    desc: 'Проводим входной контроль и экспертизу. Срок — до 10 рабочих дней.',
  },
  {
    n: 5,
    title: 'Возврат средств или замена',
    desc: 'При подтверждении брака возвращаем оплату на расчётный счёт или производим замену по согласованию.',
  },
]

export default function ReturnsPage() {
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
              <span className="text-gray-600">Возврат товара</span>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-[1400px] px-4 py-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Возврат товара</h1>
          <p className="text-sm text-gray-500 mb-8 max-w-3xl">
            Работаем с юридическими лицами в B2B-режиме. Возврат осуществляется в соответствии с
            условиями договора поставки и Гражданским кодексом РФ.
          </p>

          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
            {conditions.map((c) => (
              <div key={c.title} className="p-5 border border-gray-200 rounded bg-white">
                <div className="flex size-9 items-center justify-center bg-[#e8f4ff] mb-3 rounded">
                  <c.icon size={16} className="text-[#0066cc]" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{c.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-5">Порядок возврата</h2>
            <div className="space-y-3">
              {steps.map((s) => (
                <div
                  key={s.n}
                  className="flex gap-4 p-5 border border-gray-200 rounded bg-white"
                >
                  <div className="flex size-9 items-center justify-center bg-[#0066cc] text-white text-sm font-bold rounded shrink-0">
                    {s.n}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">{s.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-10 grid lg:grid-cols-2 gap-3">
            <div className="p-6 bg-[#fff7ed] border border-orange-200 rounded">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-[#f97316]" />
                <h3 className="text-sm font-bold text-gray-900">Возврату не подлежат</h3>
              </div>
              <ul className="space-y-1.5 text-sm text-gray-600 leading-relaxed">
                <li>— Товары без видимых дефектов, соответствующие заказу</li>
                <li>— Изделия со следами монтажа, пайки, эксплуатации</li>
                <li>— Компоненты, заказанные под индивидуальный проект (custom-orders)</li>
                <li>— Товары с истёкшим сроком уведомления (более 14 дней)</li>
              </ul>
            </div>
            <div className="p-6 bg-[#e8f4ff] border border-blue-200 rounded">
              <div className="flex items-center gap-2 mb-3">
                <FileCheck size={16} className="text-[#0066cc]" />
                <h3 className="text-sm font-bold text-gray-900">Гарантия</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-2">
                Гарантия на электронные компоненты — 12 месяцев с даты поставки, если иное не
                указано в спецификации производителя.
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Гарантийные случаи рассматриваются в индивидуальном порядке после экспертизы.
              </p>
            </div>
          </section>

          <Link
            href="/contacts"
            className="inline-flex items-center gap-1.5 h-11 px-6 text-sm font-semibold text-white bg-[#0066cc] hover:bg-[#0052a3] rounded transition-all"
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
