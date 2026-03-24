import Link from 'next/link'
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
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

const deliveryMethods = [
  {
    icon: Truck,
    name: 'СДЭК',
    time: '1–5 дней',
    price: 'от 250 ₽',
    description: 'Доставка до пункта выдачи или курьером до двери. Отслеживание в реальном времени.',
    color: 'text-[#166534]',
    bg: 'bg-[#166534]/8',
    available: 'По всей России',
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
  },
  {
    icon: Package,
    name: 'Почта России',
    time: '3–14 дней',
    price: 'от 150 ₽',
    description: 'Доставка в любой населённый пункт России. Наложенный платёж доступен.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    available: 'Вся Россия',
  },
  {
    icon: MapPin,
    name: 'Самовывоз',
    time: 'В день заказа',
    price: 'Бесплатно',
    description: 'Забрать заказ можно в нашем офисе в Москве. Готовность заказа — 2 часа.',
    color: 'text-[#166534]',
    bg: 'bg-[#166534]/8',
    available: 'Москва',
  },
]

const paymentMethods = [
  {
    icon: CreditCard,
    name: 'Банковская карта',
    description: 'Visa, Mastercard, МИР. Оплата онлайн при оформлении заказа.',
    badge: 'Мгновенно',
    badgeColor: 'text-[#166534] bg-[#166534]/8 border-[#166534]/15',
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
    badgeColor: 'text-blue-600 bg-blue-50 border-blue-100',
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
  return (
    <>
      <Header />

      <main className="flex-1 bg-[#fffaf7]">
        {/* Breadcrumb */}
        <div className="border-b border-black/8 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-3">
            <nav className="flex items-center gap-1.5 text-xs text-[#a8a29e]">
              <Link href="/" className="hover:text-[#78716c] transition-colors">Главная</Link>
              <ChevronRight size={10} />
              <span className="text-[#78716c]">Доставка и оплата</span>
            </nav>
          </div>
        </div>

        {/* Hero */}
        <div className="bg-white border-b border-black/8">
          <div className="mx-auto max-w-7xl px-4 py-10">
            <h1 className="text-2xl md:text-3xl font-bold text-[#1c1917] mb-2">Доставка и оплата</h1>
            <p className="text-[#78716c] max-w-xl">
              Отправляем заказы по всей России и СНГ. Заказы до 15:00 — в тот же день.
              Бесплатная доставка от 5 000 ₽.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-12 space-y-14">

          {/* Key info banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Clock, label: 'Отправка в день заказа', sub: 'при заказе до 15:00', color: 'text-[#166534]', bg: 'bg-[#166534]/8' },
              { icon: Truck, label: 'Бесплатная доставка', sub: 'при заказе от 5 000 ₽', color: 'text-[#f97316]', bg: 'bg-[#f97316]/8' },
              { icon: MapPin, label: 'Самовывоз бесплатно', sub: 'Москва, ул. Радиальная, 4', color: 'text-[#166534]', bg: 'bg-[#166534]/8' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-4 p-5 bg-white border border-black/8 rounded-xl shadow-sm">
                <div className={`flex size-11 items-center justify-center rounded-xl ${item.bg} shrink-0`}>
                  <item.icon size={20} className={item.color} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#1c1917]">{item.label}</div>
                  <div className="text-xs text-[#78716c] mt-0.5">{item.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Delivery methods */}
          <section>
            <h2 className="text-xl font-bold text-[#1c1917] mb-6">Способы доставки</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {deliveryMethods.map((method) => (
                <div key={method.name} className="flex gap-4 p-5 bg-white border border-black/8 rounded-xl shadow-sm">
                  <div className={`flex size-11 items-center justify-center rounded-xl ${method.bg} shrink-0`}>
                    <method.icon size={20} className={method.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-[#1c1917]">{method.name}</h3>
                      <span className="text-sm font-bold text-[#166534] shrink-0">{method.price}</span>
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs text-[#78716c]">
                        <Clock size={10} className="inline mr-1" />
                        {method.time}
                      </span>
                      <span className="text-xs text-[#a8a29e]">
                        <MapPin size={10} className="inline mr-1" />
                        {method.available}
                      </span>
                    </div>
                    <p className="text-xs text-[#78716c] leading-relaxed">{method.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Payment methods */}
          <section>
            <h2 className="text-xl font-bold text-[#1c1917] mb-6">Способы оплаты</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {paymentMethods.map((method) => (
                <div key={method.name} className="flex flex-col gap-3 p-5 bg-white border border-black/8 rounded-xl shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-[#fef3e8]">
                      <method.icon size={18} className="text-[#166534]" />
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${method.badgeColor}`}>
                      {method.badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#1c1917]">{method.name}</h3>
                  <p className="text-xs text-[#78716c] leading-relaxed">{method.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Return policy */}
          <section>
            <h2 className="text-xl font-bold text-[#1c1917] mb-6">Возврат и обмен</h2>
            <div className="bg-white border border-black/8 rounded-xl shadow-sm p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-[#1c1917] mb-3 flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-[#166534]" />
                    Принимаем возврат
                  </h3>
                  <ul className="space-y-2">
                    {[
                      'Товар ненадлежащего качества',
                      'Товар не соответствует описанию',
                      'Получен не тот товар',
                      'Повреждение при доставке',
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-[#44403c]">
                        <span className="size-1.5 rounded-full bg-[#166534] shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#1c1917] mb-3 flex items-center gap-2">
                    <AlertCircle size={15} className="text-[#f97316]" />
                    Не принимаем возврат
                  </h3>
                  <ul className="space-y-2">
                    {[
                      'Товар надлежащего качества (кроме дистанционной продажи)',
                      'Товар со следами монтажа или пайки',
                      'Нарушена заводская упаковка',
                      'Прошло более 14 дней с момента получения',
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-[#44403c]">
                        <span className="size-1.5 rounded-full bg-[#f97316] shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-5 pt-5 border-t border-black/6 text-xs text-[#78716c]">
                Для оформления возврата свяжитесь с нами по телефону или email в течение 14 дней с момента получения заказа.
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section>
            <h2 className="text-xl font-bold text-[#1c1917] mb-6">Частые вопросы</h2>
            <div className="bg-white border border-black/8 rounded-xl shadow-sm overflow-hidden">
              {faq.map((item, i) => (
                <div
                  key={i}
                  className={`px-6 py-5 ${i !== 0 ? 'border-t border-black/5' : ''}`}
                >
                  <h3 className="text-sm font-semibold text-[#1c1917] mb-2">{item.q}</h3>
                  <p className="text-sm text-[#78716c] leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Contact */}
          <section className="bg-[#fef3e8] border border-[#f97316]/15 rounded-2xl p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#1c1917] mb-1">Остались вопросы?</h2>
                <p className="text-sm text-[#78716c]">Наши менеджеры готовы помочь пн–пт с 9:00 до 18:00</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <a
                  href="tel:+78005553535"
                  className="flex items-center gap-2 h-10 px-5 text-sm font-semibold text-white bg-[#166534] hover:bg-[#15803d] rounded-xl transition-all btn-primary shadow-sm"
                >
                  <Phone size={14} />
                  Позвонить
                </a>
                <a
                  href="mailto:info@electromagaz.ru"
                  className="flex items-center gap-2 h-10 px-5 text-sm font-medium text-[#78716c] bg-white border border-black/8 hover:border-black/15 rounded-xl transition-all"
                >
                  Написать
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  )
}
