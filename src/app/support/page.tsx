import type { Metadata } from 'next'
import Link from 'next/link'
import { LifeBuoy, BookOpen, MessageCircle, ChevronRight, Phone, Mail } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'

export const metadata: Metadata = {
  title: 'Техподдержка',
  description:
    'Техническая поддержка Electromagaz: подбор аналогов, помощь с datasheet, консультация по применению компонентов.',
}

const services = [
  {
    icon: BookOpen,
    title: 'Подбор аналогов',
    desc: 'Поможем найти замену снятому с производства компоненту с учётом параметров и совместимости.',
  },
  {
    icon: LifeBuoy,
    title: 'Техническая консультация',
    desc: 'Расшифруем datasheet, поможем разобраться с режимами работы, посоветуем по схемотехнике.',
  },
  {
    icon: MessageCircle,
    title: 'Поиск редких позиций',
    desc: 'Работаем с зарубежными поставщиками. Найдём то, чего нет на складах в России.',
  },
]

const faq = [
  {
    q: 'Как быстро вы отвечаете на технический запрос?',
    a: 'Стандартное время ответа — до 24 часов в рабочие дни. Сложные запросы (подбор аналогов, поиск редких позиций) могут потребовать 1–3 рабочих дня.',
  },
  {
    q: 'Можно ли получить образец компонента для тестирования?',
    a: 'Да, по образцам работаем индивидуально. Минимальная партия для образца обычно 1–10 шт. в зависимости от компонента. Стоимость и сроки уточняйте у менеджера.',
  },
  {
    q: 'Предоставляете ли вы datasheets на нестандартные компоненты?',
    a: 'У нас есть база datasheet на большинство позиций каталога. На редкие компоненты можем запросить документацию у производителя — обычно занимает 1–2 рабочих дня.',
  },
  {
    q: 'Помогаете ли с подбором по техническому заданию (ТЗ)?',
    a: 'Да, при наличии чёткого ТЗ или технических требований наши инженеры подберут оптимальные компоненты. Услуга бесплатна при подтверждённом заказе.',
  },
  {
    q: 'Можно ли получить сертификат соответствия?',
    a: 'Да, на любую позицию из каталога можем предоставить сертификат соответствия, декларацию или паспорт качества. Документы предоставляются после оплаты заказа.',
  },
]

export default function SupportPage() {
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
              <span className="text-gray-600">Техподдержка</span>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-[1400px] px-4 py-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Техническая поддержка</h1>
          <p className="text-sm text-gray-500 mb-8 max-w-3xl">
            Команда инженеров с опытом в схемотехнике, embedded-разработке и силовой электронике
            поможет решить технические вопросы по компонентам.
          </p>

          {/* Services */}
          <section className="grid md:grid-cols-3 gap-3 mb-12">
            {services.map((s) => (
              <div key={s.title} className="p-6 border border-gray-200 rounded bg-white">
                <div className="flex size-10 items-center justify-center bg-[#e8f4ff] mb-4 rounded">
                  <s.icon size={18} className="text-[#0066cc]" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </section>

          {/* Contact */}
          <section className="mb-12 p-8 bg-gradient-to-r from-[#0066cc] to-[#0052a3] rounded">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Связаться с инженерами</h2>
                <p className="text-sm text-white/80 max-w-xl leading-relaxed">
                  Опишите задачу — постараемся помочь. Чем подробнее запрос, тем быстрее
                  получите ответ.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                <a
                  href="tel:+78005553536"
                  className="flex items-center gap-2 h-11 px-5 text-sm font-semibold text-[#0066cc] bg-white hover:bg-gray-50 rounded transition-all"
                >
                  <Phone size={14} />
                  8 (800) 555-35-36
                </a>
                <a
                  href="mailto:support@electromagaz.ru"
                  className="flex items-center gap-2 h-11 px-5 text-sm font-semibold text-white border border-white/30 hover:bg-white/10 rounded transition-all"
                >
                  <Mail size={14} />
                  support@electromagaz.ru
                </a>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-5">Частые вопросы</h2>
            <div className="space-y-2">
              {faq.map((f, i) => (
                <details
                  key={i}
                  className="group p-5 border border-gray-200 rounded bg-white open:bg-gray-50 transition-colors"
                >
                  <summary className="flex items-center justify-between cursor-pointer list-none">
                    <span className="text-sm font-bold text-gray-900 pr-4">{f.q}</span>
                    <ChevronRight
                      size={16}
                      className="text-gray-400 transition-transform group-open:rotate-90 shrink-0"
                    />
                  </summary>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed">{f.a}</p>
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
