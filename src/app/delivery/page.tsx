'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  ChevronRight,
  Truck,
  Clock,
  MapPin,
  CreditCard,
  Banknote,
  Building,
  Package,
  Phone,
  CheckCircle2,
  AlertCircle,
  Calculator,
  Box,
  Shield,
  Award,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'

const deliveryMethods = [
  {
    icon: Truck,
    name: 'СДЭК',
    time: '1–5 дней',
    price: 'от 250 ₽',
    description: 'Доставка до пункта выдачи или курьером до двери. Отслеживание в реальном времени.',
    color: 'text-[#0066cc]',
    bg: 'bg-[#0066cc]/8',
    available: 'По всей России',
    cities: 'Москва, СПб, Казань, Екатеринбург и др.',
    tracking: true,
    insurance: true,
  },
  {
    icon: Truck,
    name: 'DHL Express',
    time: '1–3 дня',
    price: 'от 490 ₽',
    description: 'Экспресс-доставка по России и СНГ. Гарантированные сроки, страховка груза.',
    color: 'text-[#f97316]',
    bg: 'bg-[#f97316]/8',
    available: 'Россия и СНГ',
    cities: 'Крупные города',
    tracking: true,
    insurance: true,
  },
  {
    icon: Package,
    name: 'Почта России',
    time: '3–14 дней',
    price: 'от 150 ₽',
    description: 'Доставка в любой населённый пункт России. Наложенный платёж доступен.',
    color: 'text-[#0066cc]',
    bg: 'bg-[#e8f4ff]',
    available: 'Вся Россия',
    cities: 'Все населённые пункты',
    tracking: true,
    insurance: false,
  },
  {
    icon: MapPin,
    name: 'Самовывоз',
    time: 'В день заказа',
    price: 'Бесплатно',
    description: 'Забрать заказ можно в нашем офисе в Москве. Готовность заказа — 2 часа.',
    color: 'text-[#0066cc]',
    bg: 'bg-[#0066cc]/8',
    available: 'Москва',
    cities: 'Москва, ул. Примерная, 123',
    tracking: false,
    insurance: false,
  },
]

const cities = [
  { name: 'Москва', days: '1–2', points: 450 },
  { name: 'Санкт-Петербург', days: '2–3', points: 320 },
  { name: 'Казань', days: '2–4', points: 85 },
  { name: 'Екатеринбург', days: '3–5', points: 120 },
  { name: 'Новосибирск', days: '4–6', points: 95 },
  { name: 'Краснодар', days: '3–5', points: 110 },
  { name: 'Владивосток', days: '5–8', points: 45 },
  { name: 'Калининград', days: '4–6', points: 38 },
]

const packagingSteps = [
  {
    icon: Box,
    title: 'Антистатическая упаковка',
    desc: 'Все микросхемы и чувствительные компоненты упаковываются в антистатические пакеты',
  },
  {
    icon: Shield,
    title: 'Защита от повреждений',
    desc: 'Используем пузырчатую плёнку и картонные вкладыши для защиты хрупких товаров',
  },
  {
    icon: Package,
    title: 'Надёжная коробка',
    desc: 'Упаковываем в прочные картонные коробки с маркировкой "Хрупкое"',
  },
  {
    icon: Award,
    title: 'Проверка перед отправкой',
    desc: 'Каждый заказ проверяется на комплектность и качество упаковки',
  },
]

const paymentMethods = [
  {
    icon: CreditCard,
    name: 'Банковская карта',
    description: 'Visa, Mastercard, МИР. Оплата онлайн при оформлении заказа.',
    badge: 'Мгновенно',
    badgeColor: 'text-[#0066cc] bg-[#0066cc]/8 border-[#0066cc]/15',
  },
  {
    icon: Building,
    name: 'Безналичный расчёт',
    description: 'Оплата по счёту для юридических лиц и ИП. Все необходимые документы.',
    badge: 'Для бизнеса',
    badgeColor: 'text-[#f97316] bg-[#f97316]/8 border-[#f97316]/15',
  },
  {
    icon: Banknote,
    name: 'Наличными',
    description: 'При самовывозе из офиса или наложенным платежом через Почту России.',
    badge: 'При получении',
    badgeColor: 'text-[#0066cc] bg-[#e8f4ff] border-[#0066cc/15]',
  },
]

const faq = [
  {
    q: 'Когда отправляется заказ?',
    a: 'Заказы, оформленные до 15:00 по московскому времени, отправляются в тот же день. Заказы после 15:00 — на следующий рабочий день.',
  },
  {
    q: 'Как отследить заказ?',
    a: 'После отправки вы получите трек-номер на email. Отслеживание доступно на сайте транспортной компании или в личном кабинете.',
  },
  {
    q: 'Что делать, если товар пришёл повреждённым?',
    a: 'Сфотографируйте повреждения при получении и свяжитесь с нами в течение 24 часов. Мы заменим товар или вернём деньги.',
  },
  {
    q: 'Возможна ли доставка за рубеж?',
    a: 'Да, доставляем в страны СНГ через DHL. Стоимость и сроки рассчитываются индивидуально. Напишите нам для уточнения.',
  },
  {
    q: 'Есть ли минимальная сумма заказа?',
    a: 'Минимальная сумма заказа — 500 ₽. При заказе от 5 000 ₽ доставка по России бесплатна.',
  },
]

export default function DeliveryPage() {
  const [selectedCity, setSelectedCity] = useState('Москва')
  const [orderDate, setOrderDate] = useState('today')

  const calculateDelivery = () => {
    const city = cities.find(c => c.name === selectedCity)
    if (!city) return 'Выберите город'
    
    const addDays = orderDate === 'today' ? 0 : 1
    const [min, max] = city.days.split('–').map(d => parseInt(d))
    
    return `${min + addDays}–${max + addDays} дней`
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <StickyNav />

      <main>
        {/* Breadcrumb */}
        <div className="bg-white">
          <div className="mx-auto max-w-[1400px] px-4 py-3">
            <nav className="flex items-center gap-1.5 text-xs text-gray-400">
              <Link href="/" className="hover:text-gray-600 transition-colors">Главная</Link>
              <ChevronRight size={10} />
              <span className="text-gray-600">Доставка и оплата</span>
            </nav>
          </div>
        </div>

        {/* Hero */}
        <div className="bg-white py-12">
          <div className="mx-auto max-w-[1400px] px-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Доставка и оплата</h1>
            <p className="text-gray-600 max-w-2xl text-lg">
              Отправляем заказы по всей России и СНГ. Заказы до 15:00 — в тот же день.
              Бесплатная доставка от 5 000 ₽.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-[1400px] px-4 pb-16 space-y-16">

          {/* Key info banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { icon: Clock, label: 'Отправка в день заказа', sub: 'при заказе до 15:00', color: 'text-[#0066cc]', bg: 'bg-[#e8f4ff]' },
              { icon: Truck, label: 'Бесплатная доставка', sub: 'при заказе от 5 000 ₽', color: 'text-[#f97316]', bg: 'bg-orange-50' },
              { icon: MapPin, label: 'Самовывоз бесплатно', sub: 'Москва, готовность за 2 часа', color: 'text-[#0066cc]', bg: 'bg-[#e8f4ff]' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-4 p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className={`flex size-12 items-center justify-center rounded-lg ${item.bg} shrink-0`}>
                  <item.icon size={22} className={item.color} />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">{item.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{item.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Delivery Calculator */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Calculator size={24} className="text-[#0066cc]" />
              <h2 className="text-2xl font-bold text-gray-900">Когда придёт мой заказ?</h2>
            </div>
            <div className="bg-gradient-to-br from-[#e8f4ff] to-[#f0f9ff] rounded-lg p-8 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Ваш город</label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full h-11 px-4 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0066cc] focus:border-transparent"
                  >
                    {cities.map((city) => (
                      <option key={city.name} value={city.name}>{city.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Дата заказа</label>
                  <select
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="w-full h-11 px-4 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0066cc] focus:border-transparent"
                  >
                    <option value="today">Сегодня (до 15:00)</option>
                    <option value="tomorrow">Завтра</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <div className="w-full h-11 px-4 bg-white rounded-lg flex items-center justify-center border-2 border-[#0066cc]">
                    <span className="text-lg font-bold text-[#0066cc]">{calculateDelivery()}</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-4">
                * Сроки указаны для доставки СДЭК. Точная стоимость рассчитывается при оформлении заказа.
              </p>
            </div>
          </section>

          {/* Comparison Table */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Сравнение способов доставки</h2>
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-lg shadow-sm overflow-hidden">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Способ доставки</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Сроки</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Стоимость</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">География</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-900">Трекинг</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-900">Страховка</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveryMethods.map((method, i) => (
                    <tr key={method.name} className={`${i !== deliveryMethods.length - 1 ? 'border-b border-gray-100' : ''} hover:bg-gray-50 transition-colors`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex size-10 items-center justify-center rounded ${method.bg}`}>
                            <method.icon size={18} className={method.color} />
                          </div>
                          <span className="text-sm font-semibold text-gray-900">{method.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{method.time}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-[#0066cc]">{method.price}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{method.cities}</td>
                      <td className="px-6 py-4 text-center">
                        {method.tracking ? (
                          <CheckCircle2 size={18} className="text-green-600 mx-auto" />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {method.insurance ? (
                          <CheckCircle2 size={18} className="text-green-600 mx-auto" />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Cities with pickup points */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Пункты выдачи СДЭК</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {cities.map((city) => (
                <div key={city.name} className="bg-white rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-bold text-gray-900">{city.name}</h3>
                    <MapPin size={16} className="text-[#0066cc] shrink-0" />
                  </div>
                  <div className="text-xs text-gray-500 mb-1">{city.days} дней</div>
                  <div className="text-xs text-gray-400">{city.points} пунктов выдачи</div>
                </div>
              ))}
            </div>
          </section>

          {/* Packaging infographic */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Как мы упаковываем заказы</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {packagingSteps.map((step, i) => (
                <div key={i} className="relative">
                  <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex size-12 items-center justify-center rounded-lg bg-[#e8f4ff]">
                        <step.icon size={22} className="text-[#0066cc]" />
                      </div>
                      <span className="text-2xl font-bold text-gray-200">{i + 1}</span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-xs text-gray-600 leading-relaxed">{step.desc}</p>
                  </div>
                  {i < packagingSteps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gray-200 -translate-y-1/2" />
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Payment methods */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Способы оплаты</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {paymentMethods.map((method) => (
                <div key={method.name} className="flex flex-col gap-4 p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex size-12 items-center justify-center rounded-lg bg-[#e8f4ff]">
                      <method.icon size={20} className="text-[#0066cc]" />
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${method.badgeColor}`}>
                      {method.badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">{method.name}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{method.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Return policy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Возврат и обмен</h2>
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle2 size={20} className="text-green-600" />
                    Принимаем возврат
                  </h3>
                  <ul className="space-y-3">
                    {[
                      'Товар ненадлежащего качества',
                      'Товар не соответствует описанию',
                      'Получен не тот товар',
                      'Повреждение при доставке',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm text-gray-700">
                        <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertCircle size={20} className="text-[#f97316]" />
                    Не принимаем возврат
                  </h3>
                  <ul className="space-y-3">
                    {[
                      'Товар надлежащего качества (кроме дистанционной продажи)',
                      'Товар со следами монтажа или пайки',
                      'Нарушена заводская упаковка',
                      'Прошло более 14 дней с момента получения',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm text-gray-700">
                        <AlertCircle size={16} className="text-[#f97316] shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-100 text-sm text-gray-600">
                Для оформления возврата свяжитесь с нами по телефону или email в течение 14 дней с момента получения заказа.
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Частые вопросы</h2>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {faq.map((item, i) => (
                <div
                  key={i}
                  className={`px-8 py-6 ${i !== 0 ? 'border-t border-gray-100' : ''} hover:bg-gray-50 transition-colors`}
                >
                  <h3 className="text-sm font-bold text-gray-900 mb-2">{item.q}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Contact */}
          <section className="bg-gradient-to-br from-[#e8f4ff] to-[#f0f9ff] rounded-lg p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Остались вопросы?</h2>
                <p className="text-sm text-gray-600">Наши менеджеры готовы помочь пн–пт с 9:00 до 18:00</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <a
                  href="tel:+78005553535"
                  className="flex items-center justify-center gap-2 h-11 px-6 text-sm font-bold text-white bg-[#0066cc] hover:bg-[#0052a3] rounded-lg transition-all shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_rgba(0,102,204,0.25)]"
                >
                  <Phone size={16} />
                  Позвонить
                </a>
                <a
                  href="mailto:info@electromagaz.ru"
                  className="flex items-center justify-center gap-2 h-11 px-6 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition-all shadow-sm"
                >
                  Написать
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
