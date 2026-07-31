'use client'

import Link from 'next/link'
import { HelpCircle, Search, Phone, Mail, FileText, Package, CreditCard, Truck, RefreshCw } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'
import { COMPANY } from '@/lib/company'

const faqCategories = [
  {
    title: 'Заказы и оплата',
    icon: CreditCard,
    questions: [
      { q: 'Как отправить заявку?', a: 'Добавьте товары в корзину, укажите контакты и отправьте запрос коммерческого предложения.' },
      { q: 'Какие способы оплаты доступны?', a: 'Способ и срок оплаты согласуются для конкретной поставки и фиксируются в коммерческом предложении или договоре.' },
      { q: 'Можно ли изменить заявку?', a: 'Свяжитесь с менеджером и сообщите номер заявки. Возможность изменения зависит от стадии её обработки.' },
    ],
  },
  {
    title: 'Доставка',
    icon: Truck,
    questions: [
      { q: 'Сколько стоит доставка?', a: 'Стоимость и способ доставки рассчитываются для конкретной заявки и указываются в коммерческом предложении.' },
      { q: 'Как долго ждать доставку?', a: 'Срок зависит от позиции и способа поставки. Подтверждённый срок указывается в коммерческом предложении.' },
      { q: 'Можно ли забрать товар самостоятельно?', a: 'Возможность и адрес получения уточняются для конкретной поставки.' },
    ],
  },
  {
    title: 'Возврат и обмен',
    icon: RefreshCw,
    questions: [
      { q: 'Как заявить о проблеме с товаром?', a: 'Свяжитесь с менеджером, сообщите номер поставки и приложите описание проблемы. Порядок рассмотрения определяется договором и применимым законодательством.' },
      { q: 'Как принимается решение о возврате?', a: 'Обстоятельства и документы рассматриваются отдельно для каждой поставки.' },
      { q: 'Можно ли заменить товар?', a: 'Возможность замены определяется после рассмотрения обращения и условий поставки.' },
    ],
  },
  {
    title: 'Товары и наличие',
    icon: Package,
    questions: [
      { q: 'Как узнать наличие товара?', a: 'Каталог помогает сформировать заявку. Фактическое наличие подтверждает менеджер в коммерческом предложении.' },
      { q: 'Можно ли запросить товар, которого нет в каталоге?', a: 'Да, добавьте MPN и требуемое количество в комментарий или приложите спецификацию.' },
      { q: 'Какие гарантийные условия действуют?', a: 'Условия зависят от позиции и поставки и фиксируются в коммерческом предложении или договоре.' },
    ],
  },
]

export default function HelpPage() {
  return (
    <>
      <Header />
      <StickyNav />
      <main className="min-h-screen bg-canvas py-6">
        <div className="mx-auto max-w-[1380px] px-4 lg:px-0">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm text-ink-3 mb-6">
            <Link href="/" className="hover:text-azure">Главная</Link>
            <span>/</span>
            <span className="text-ink">Помощь</span>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <HelpCircle size={28} className="text-azure" />
            <h1 className="text-3xl font-bold tracking-[-0.035em] text-ink">Центр помощи</h1>
          </div>

          {/* Search */}
          <div className="mb-8 rounded-2xl bg-white p-6 shadow-[var(--shadow-xs)]" data-motion-reveal>
            <div className="relative max-w-2xl mx-auto">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-4" />
              <input
                type="text"
                placeholder="Поиск по вопросам..."
                className="h-12 w-full rounded-xl border border-[var(--border-2)] pl-12 pr-4 text-sm focus:border-azure focus:outline-none"
              />
            </div>
          </div>

          {/* Contact Cards */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <a href={`tel:${COMPANY.phone.raw}`} className="rounded-2xl bg-white p-6 shadow-[var(--shadow-xs)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-azure-md)]">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                <Phone size={24} className="text-azure" />
              </div>
              <h3 className="font-semibold text-ink mb-2">Позвонить</h3>
              <p className="text-sm text-ink-3">{COMPANY.phone.display}</p>
              <p className="text-xs text-ink-4 mt-1">Мобильный телефон</p>
            </a>

            <a href={`mailto:${COMPANY.supportEmail}`} className="rounded-2xl bg-white p-6 shadow-[var(--shadow-xs)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-azure-md)]">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                <Mail size={24} className="text-azure" />
              </div>
              <h3 className="font-semibold text-ink mb-2">Написать</h3>
              <p className="text-sm text-ink-3">{COMPANY.supportEmail}</p>
              <p className="text-xs text-ink-4 mt-1">Единый адрес для обращений</p>
            </a>
          </div>

          {/* FAQ Categories */}
          <div className="space-y-6">
            {faqCategories.map((category, idx) => (
              <div key={idx} className="rounded-2xl bg-white p-6 shadow-[var(--shadow-xs)]">
                <div className="flex items-center gap-3 mb-4">
                  <category.icon size={24} className="text-azure" />
                  <h2 className="text-xl font-semibold text-ink">{category.title}</h2>
                </div>
                <div className="space-y-4">
                  {category.questions.map((item, qIdx) => (
                    <details key={qIdx} className="group">
                      <summary className="flex items-center justify-between cursor-pointer list-none p-4 hover:bg-[#fafafa] rounded transition-colors">
                        <span className="font-medium text-ink">{item.q}</span>
                        <svg
                          className="w-5 h-5 text-ink-4 transition-transform group-open:rotate-180"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="px-4 pb-4 text-sm text-ink-3">
                        {item.a}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Additional Resources */}
          <div className="mt-8 rounded-2xl bg-white p-6 shadow-[var(--shadow-xs)]">
            <h2 className="text-xl font-semibold text-ink mb-4">Полезные ссылки</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Link href="/delivery" className="flex items-center gap-3 p-4 hover:bg-[#fafafa] rounded transition-colors">
                <FileText size={20} className="text-ink-4" />
                <span className="text-ink-2">Условия доставки</span>
              </Link>
              <Link href="/wholesale" className="flex items-center gap-3 p-4 hover:bg-[#fafafa] rounded transition-colors">
                <FileText size={20} className="text-ink-4" />
                <span className="text-ink-2">Оптовым покупателям</span>
              </Link>
              <Link href="/privacy" className="flex items-center gap-3 p-4 hover:bg-[#fafafa] rounded transition-colors">
                <FileText size={20} className="text-ink-4" />
                <span className="text-ink-2">Политика конфиденциальности</span>
              </Link>
              <Link href="/terms" className="flex items-center gap-3 p-4 hover:bg-[#fafafa] rounded transition-colors">
                <FileText size={20} className="text-ink-4" />
                <span className="text-ink-2">Пользовательское соглашение</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
