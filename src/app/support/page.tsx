import type { Metadata } from 'next'
import Link from 'next/link'
import { LifeBuoy, BookOpen, MessageCircle, ChevronRight, Phone, Mail } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'
import { COMPANY } from '@/lib/company'

export const metadata: Metadata = {
  title: 'Техподдержка',
  description:
    'Обращения по подбору электронных компонентов, datasheet и техническим параметрам позиций.',
}

const services = [
  {
    icon: BookOpen,
    title: 'Запрос аналога',
    desc: 'Примем запрос на замену компонента с указанием ключевых параметров и ограничений.',
  },
  {
    icon: LifeBuoy,
    title: 'Вопрос по документации',
    desc: 'Проверим доступность datasheet и другой документации для выбранной позиции.',
  },
  {
    icon: MessageCircle,
    title: 'Позиция вне каталога',
    desc: 'Примем MPN, производителя и требуемое количество для проверки возможности поставки.',
  },
]

const faq = [
  {
    q: 'Как быстро вы отвечаете на технический запрос?',
    a: 'Срок зависит от состава запроса и доступности данных. Менеджер подтвердит дальнейшие шаги после обработки обращения.',
  },
  {
    q: 'Можно ли получить образец компонента для тестирования?',
    a: 'Укажите MPN и требуемое количество. Возможность, стоимость и срок поставки образца подтверждаются отдельно.',
  },
  {
    q: 'Предоставляете ли вы datasheets на нестандартные компоненты?',
    a: 'Доступные datasheet отображаются в каталоге. По отсутствующей документации можно направить отдельный запрос.',
  },
  {
    q: 'Помогаете ли с подбором по техническому заданию (ТЗ)?',
    a: 'Направьте ТЗ и обязательные параметры. Возможность и условия подбора подтверждаются после рассмотрения запроса.',
  },
  {
    q: 'Можно ли получить сертификат соответствия?',
    a: 'Комплект доступных документов зависит от позиции и источника поставки. Запросите его до согласования коммерческого предложения.',
  },
]

export default function SupportPage() {
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
              <span className="text-ink-3">Техподдержка</span>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-[1380px] px-4 py-7 lg:px-0">
          <h1 className="mb-1 text-3xl font-bold tracking-[-0.035em] text-ink">Техническая поддержка</h1>
          <p className="text-sm text-ink-3 mb-8 max-w-3xl">
            Направьте MPN, технические параметры и описание задачи. Мы проверим доступные
            данные и возможность обработки запроса.
          </p>

          {/* Services */}
          <section className="grid md:grid-cols-3 gap-3 mb-12">
            {services.map((s) => (
              <div key={s.title} className="rounded-2xl bg-white p-6 shadow-[var(--shadow-xs)]">
                <div className="flex size-10 items-center justify-center bg-azure-light mb-4 rounded">
                  <s.icon size={18} className="text-azure" />
                </div>
                <h3 className="text-sm font-bold text-ink mb-2">{s.title}</h3>
                <p className="text-sm text-ink-3 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </section>

          {/* Contact */}
          <section className="mb-12 rounded-2xl bg-azure p-8" data-motion-reveal>
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Направить технический запрос</h2>
                <p className="text-sm text-white/80 max-w-xl leading-relaxed">
                  Опишите задачу - постараемся помочь. Чем подробнее запрос, тем быстрее
                  получите ответ.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                <a
                  href={`tel:${COMPANY.phone.raw}`}
                  className="flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-azure transition duration-200 hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Phone size={14} />
                  {COMPANY.phone.display}
                </a>
                <a
                  href={`mailto:${COMPANY.supportEmail}`}
                  className="flex h-11 items-center gap-2 rounded-xl border border-white/30 px-5 text-sm font-semibold text-white transition-all hover:bg-white/10"
                >
                  <Mail size={14} />
                  {COMPANY.supportEmail}
                </a>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section>
            <h2 className="text-xl font-bold text-ink mb-5">Частые вопросы</h2>
            <div className="space-y-2">
              {faq.map((f, i) => (
                <details
                  key={i}
                  className="group rounded-2xl bg-white p-5 shadow-[var(--shadow-xs)] transition-colors open:bg-azure-dim"
                >
                  <summary className="flex items-center justify-between cursor-pointer list-none">
                    <span className="text-sm font-bold text-ink pr-4">{f.q}</span>
                    <ChevronRight
                      size={16}
                      className="text-ink-4 transition-transform group-open:rotate-90 shrink-0"
                    />
                  </summary>
                  <p className="mt-3 text-sm text-ink-3 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
