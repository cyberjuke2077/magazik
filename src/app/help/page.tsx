'use client'

import Link from 'next/link'
import { HelpCircle, Search, Phone, Mail, MessageCircle, FileText, Package, CreditCard, Truck, RefreshCw } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'
import { COMPANY } from '@/lib/company'

const faqCategories = [
  {
    title: 'Заказы и оплата',
    icon: CreditCard,
    questions: [
      { q: 'Как оформить заказ?', a: 'Добавьте товары в корзину и перейдите к оформлению заказа.' },
      { q: 'Какие способы оплаты доступны?', a: 'Мы принимаем банковские карты, наличные при получении, безналичный расчет для юр. лиц.' },
      { q: 'Можно ли отменить заказ?', a: 'Да, вы можете отменить заказ до момента его отправки.' },
    ],
  },
  {
    title: 'Доставка',
    icon: Truck,
    questions: [
      { q: 'Сколько стоит доставка?', a: 'Стоимость доставки зависит от региона и веса заказа. Бесплатная доставка от 5000₽.' },
      { q: 'Как долго ждать доставку?', a: 'По Москве - 1-2 дня, по России - 3-7 дней.' },
      { q: 'Можно ли забрать заказ самовывозом?', a: 'Да, самовывоз доступен из наших пунктов выдачи.' },
    ],
  },
  {
    title: 'Возврат и обмен',
    icon: RefreshCw,
    questions: [
      { q: 'Как вернуть товар?', a: 'Вы можете вернуть товар в течение 14 дней с момента получения.' },
      { q: 'Возвращаются ли деньги за возврат?', a: 'Да, деньги возвращаются в течение 10 рабочих дней.' },
      { q: 'Можно ли обменять товар?', a: 'Да, обмен возможен на аналогичный товар или другой товар.' },
    ],
  },
  {
    title: 'Товары и наличие',
    icon: Package,
    questions: [
      { q: 'Как узнать наличие товара?', a: 'Информация о наличии отображается на странице товара.' },
      { q: 'Можно ли заказать товар под заказ?', a: 'Да, свяжитесь с нами для уточнения сроков поставки.' },
      { q: 'Есть ли гарантия на товары?', a: 'Да, на все товары распространяется гарантия производителя.' },
    ],
  },
]

export default function HelpPage() {
  return (
    <>
      <Header />
      <StickyNav />
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-[1400px] px-4">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Link href="/" className="hover:text-[#0066cc]">Главная</Link>
            <span>/</span>
            <span className="text-gray-900">Помощь</span>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <HelpCircle size={28} className="text-[#0066cc]" />
            <h1 className="text-2xl font-bold text-gray-900">Центр помощи</h1>
          </div>

          {/* Search */}
          <div className="bg-white rounded-lg p-6 mb-8">
            <div className="relative max-w-2xl mx-auto">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по вопросам..."
                className="w-full h-12 pl-12 pr-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#0066cc]"
              />
            </div>
          </div>

          {/* Contact Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <a href={`tel:${COMPANY.phone.raw}`} className="bg-white rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                <Phone size={24} className="text-[#0066cc]" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Позвонить</h3>
              <p className="text-sm text-gray-600">{COMPANY.phone.display}</p>
              <p className="text-xs text-gray-400 mt-1">Пн-Пт 9:00-18:00</p>
            </a>

            <a href={`mailto:${COMPANY.supportEmail}`} className="bg-white rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                <Mail size={24} className="text-[#0066cc]" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Написать</h3>
              <p className="text-sm text-gray-600">{COMPANY.supportEmail}</p>
              <p className="text-xs text-gray-400 mt-1">Ответим в течение 24 часов</p>
            </a>

            <button className="bg-white rounded-lg p-6 hover:shadow-lg transition-shadow text-left">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                <MessageCircle size={24} className="text-[#0066cc]" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Онлайн-чат</h3>
              <p className="text-sm text-gray-600">Задать вопрос</p>
              <p className="text-xs text-gray-400 mt-1">Обычно отвечаем за 5 минут</p>
            </button>
          </div>

          {/* FAQ Categories */}
          <div className="space-y-6">
            {faqCategories.map((category, idx) => (
              <div key={idx} className="bg-white rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <category.icon size={24} className="text-[#0066cc]" />
                  <h2 className="text-xl font-semibold text-gray-900">{category.title}</h2>
                </div>
                <div className="space-y-4">
                  {category.questions.map((item, qIdx) => (
                    <details key={qIdx} className="group">
                      <summary className="flex items-center justify-between cursor-pointer list-none p-4 hover:bg-gray-50 rounded transition-colors">
                        <span className="font-medium text-gray-900">{item.q}</span>
                        <svg
                          className="w-5 h-5 text-gray-400 transition-transform group-open:rotate-180"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="px-4 pb-4 text-sm text-gray-600">
                        {item.a}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Additional Resources */}
          <div className="bg-white rounded-lg p-6 mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Полезные ссылки</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Link href="/delivery" className="flex items-center gap-3 p-4 hover:bg-gray-50 rounded transition-colors">
                <FileText size={20} className="text-gray-400" />
                <span className="text-gray-700">Условия доставки</span>
              </Link>
              <Link href="/wholesale" className="flex items-center gap-3 p-4 hover:bg-gray-50 rounded transition-colors">
                <FileText size={20} className="text-gray-400" />
                <span className="text-gray-700">Оптовым покупателям</span>
              </Link>
              <Link href="#" className="flex items-center gap-3 p-4 hover:bg-gray-50 rounded transition-colors">
                <FileText size={20} className="text-gray-400" />
                <span className="text-gray-700">Политика конфиденциальности</span>
              </Link>
              <Link href="#" className="flex items-center gap-3 p-4 hover:bg-gray-50 rounded transition-colors">
                <FileText size={20} className="text-gray-400" />
                <span className="text-gray-700">Пользовательское соглашение</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
