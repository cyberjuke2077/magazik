import type { Metadata } from 'next'
import Link from 'next/link'
import { Phone, Mail, MapPin, Clock, MessageCircle, Send } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'

export const metadata: Metadata = {
  title: 'Контакты',
  description:
    'Контакты Electromagaz: телефон, email, адрес офиса, режим работы. Связаться с менеджером для оформления заказа.',
}

const departments = [
  {
    title: 'Отдел продаж',
    desc: 'Запросы КП, оформление заказов, работа с BOM',
    phone: '+7 (800) 555-35-35',
    email: 'sales@electromagaz.ru',
  },
  {
    title: 'Техническая поддержка',
    desc: 'Подбор аналогов, технические вопросы, datasheets',
    phone: '+7 (800) 555-35-36',
    email: 'support@electromagaz.ru',
  },
  {
    title: 'Бухгалтерия',
    desc: 'Документы, акты сверки, оплата',
    phone: '+7 (800) 555-35-37',
    email: 'accounting@electromagaz.ru',
  },
]

export default function ContactsPage() {
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
              <span className="text-gray-600">Контакты</span>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-[1400px] px-4 py-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Контакты</h1>
          <p className="text-sm text-gray-500 mb-8">
            Свяжитесь с нами удобным способом — ответим в течение 24 часов в рабочие дни
          </p>

          <div className="grid lg:grid-cols-3 gap-3 mb-10">
            {/* Phone */}
            <div className="p-6 border border-gray-200 rounded bg-white">
              <div className="flex size-10 items-center justify-center bg-[#e8f4ff] mb-4 rounded">
                <Phone size={18} className="text-[#0066cc]" />
              </div>
              <div className="text-xs text-gray-500 mb-1">Телефон</div>
              <a
                href="tel:+78005553535"
                className="block text-lg font-bold text-gray-900 hover:text-[#0066cc] mb-1 transition-colors"
              >
                8 (800) 555-35-35
              </a>
              <p className="text-xs text-gray-500">Звонок по России бесплатный</p>
            </div>

            {/* Email */}
            <div className="p-6 border border-gray-200 rounded bg-white">
              <div className="flex size-10 items-center justify-center bg-[#e8f4ff] mb-4 rounded">
                <Mail size={18} className="text-[#0066cc]" />
              </div>
              <div className="text-xs text-gray-500 mb-1">Email</div>
              <a
                href="mailto:info@electromagaz.ru"
                className="block text-lg font-bold text-gray-900 hover:text-[#0066cc] mb-1 transition-colors"
              >
                info@electromagaz.ru
              </a>
              <p className="text-xs text-gray-500">Ответим в течение 24 часов</p>
            </div>

            {/* Schedule */}
            <div className="p-6 border border-gray-200 rounded bg-white">
              <div className="flex size-10 items-center justify-center bg-[#e8f4ff] mb-4 rounded">
                <Clock size={18} className="text-[#0066cc]" />
              </div>
              <div className="text-xs text-gray-500 mb-1">Режим работы</div>
              <div className="text-lg font-bold text-gray-900 mb-1">Пн–Пт 9:00–18:00</div>
              <p className="text-xs text-gray-500">Сб, Вс — выходные</p>
            </div>
          </div>

          {/* Address */}
          <section className="mb-10 grid lg:grid-cols-2 gap-6">
            <div className="p-6 border border-gray-200 rounded bg-white">
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={18} className="text-[#0066cc]" />
                <h2 className="text-base font-bold text-gray-900">Офис и склад</h2>
              </div>
              <div className="text-sm text-gray-600 leading-relaxed mb-4">
                <div className="font-semibold text-gray-900 mb-1">г. Москва</div>
                <div>ул. Электронная, д. 12, БЦ «Микрочип», офис 405</div>
                <div className="text-xs text-gray-500 mt-2">
                  м. Электрозаводская, 5 минут пешком
                </div>
              </div>
              <div className="text-xs text-gray-500 leading-relaxed pt-3 border-t border-gray-100">
                Самовывоз доступен по предварительной заявке. Согласовывайте время с менеджером
                заранее, чтобы заказ был готов к выдаче.
              </div>
            </div>

            <div className="p-6 border border-gray-200 rounded bg-[#e8f4ff]">
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle size={18} className="text-[#0066cc]" />
                <h2 className="text-base font-bold text-gray-900">Мессенджеры</h2>
              </div>
              <div className="space-y-2.5 text-sm">
                <a
                  href="https://t.me/electromagaz"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-3 bg-white rounded hover:shadow-sm transition-all"
                >
                  <Send size={16} className="text-[#0088cc]" />
                  <div>
                    <div className="font-semibold text-gray-900">Telegram</div>
                    <div className="text-xs text-gray-500">@electromagaz</div>
                  </div>
                </a>
                <a
                  href="https://wa.me/78005553535"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-3 bg-white rounded hover:shadow-sm transition-all"
                >
                  <MessageCircle size={16} className="text-[#25D366]" />
                  <div>
                    <div className="font-semibold text-gray-900">WhatsApp</div>
                    <div className="text-xs text-gray-500">+7 (800) 555-35-35</div>
                  </div>
                </a>
              </div>
            </div>
          </section>

          {/* Departments */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-5">Отделы</h2>
            <div className="grid md:grid-cols-3 gap-3">
              {departments.map((d) => (
                <div key={d.title} className="p-5 border border-gray-200 rounded bg-white">
                  <h3 className="text-sm font-bold text-gray-900 mb-1">{d.title}</h3>
                  <p className="text-xs text-gray-500 mb-4 leading-relaxed">{d.desc}</p>
                  <div className="space-y-1.5 text-xs">
                    <a
                      href={`tel:${d.phone.replace(/\D/g, '')}`}
                      className="flex items-center gap-1.5 text-gray-700 hover:text-[#0066cc] transition-colors"
                    >
                      <Phone size={11} className="text-[#0066cc]" />
                      {d.phone}
                    </a>
                    <a
                      href={`mailto:${d.email}`}
                      className="flex items-center gap-1.5 text-gray-700 hover:text-[#0066cc] transition-colors"
                    >
                      <Mail size={11} className="text-[#0066cc]" />
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
