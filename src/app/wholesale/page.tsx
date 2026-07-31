'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ChevronRight,
  Package2,
  TrendingDown,
  FileText,
  Headphones,
  Check,
  Building2,
  Mail,
  Phone,
  User,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'
import { COMPANY } from '@/lib/company'
import { submitWholesaleLead } from './actions'

const cooperationSteps = [
  { label: 'Спецификация', description: 'Пришлите MPN, количество и желаемые сроки' },
  { label: 'Проверка', description: 'Уточним доступность позиций и комплект документов' },
  { label: 'Коммерческое предложение', description: 'Зафиксируем цены и условия конкретной поставки' },
  { label: 'Согласование', description: 'Согласуем оплату, отгрузку и дальнейшие действия' },
]

const benefits = [
  {
    icon: TrendingDown,
    title: 'Индивидуальные цены',
    description: 'Рассчитываем предложение под состав и объём конкретной заявки',
    color: 'text-azure',
    bg: 'bg-azure/8',
  },
  {
    icon: FileText,
    title: 'Документы к поставке',
    description: 'Состав доступных документов подтверждаем для конкретных позиций',
    color: 'text-accent',
    bg: 'bg-accent/8',
  },
  {
    icon: Package2,
    title: 'Планирование поставки',
    description: 'Согласуем наличие, сроки и возможность резервирования позиций',
    color: 'text-azure',
    bg: 'bg-azure/8',
  },
  {
    icon: Headphones,
    title: 'Связь с менеджером',
    description: 'Можно направить запрос по MPN, аналогам и условиям поставки',
    color: 'text-accent',
    bg: 'bg-accent/8',
  },
]

const conditions = [
  'Работаем с юридическими лицами и ИП',
  'Цена, наличие и минимальная партия подтверждаются в коммерческом предложении',
  'Способ и срок оплаты фиксируются в счёте или договоре',
  'География и способ доставки согласуются для конкретной поставки',
  'Комплект документов зависит от товара и условий сделки',
  'Можно направить спецификацию под конкретный проект',
]

export default function WholesalePage() {
  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    message: '',
  })
  const [consent, setConsent] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.name || !form.email || !form.phone) {
      setError('Заполните обязательные поля')
      return
    }
    if (!consent) {
      setError('Необходимо согласие на обработку персональных данных')
      return
    }
    setLoading(true)
    const result = await submitWholesaleLead({
      name: form.name,
      company: form.company,
      phone: form.phone,
      email: form.email,
      message: form.message,
      consent,
    })
    setLoading(false)
    if (result.success) {
      setSubmitted(true)
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Header />
      <StickyNav />

      <main>
        {/* Breadcrumb */}
        <div className="border-b border-black/8 bg-white">
          <div className="mx-auto max-w-[1440px] px-3 py-2 sm:px-6">
            <nav className="flex items-center gap-1.5 text-xs text-ink-4">
              <Link href="/" className="hover:text-ink-3 transition-colors">Главная</Link>
              <ChevronRight size={10} />
              <span className="text-ink-3">Оптом</span>
            </nav>
          </div>
        </div>

        {/* Hero */}
        <div className="relative overflow-hidden bg-azure">
          <Image
            src="/storefront/hero-components.jpg"
            alt="Электронные компоненты для оптовой поставки"
            fill
            loading="eager"
            fetchPriority="high"
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#064a9a]/98 via-[#075fbd]/88 to-[#0969da]/25" />
          <div className="relative mx-auto max-w-[1380px] px-3 py-10 sm:px-6 sm:py-12" data-motion-reveal>
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/15 border border-white/20 rounded-sm text-xs text-white font-medium mb-5">
                <Package2 size={11} />
                Оптовые поставки
              </div>
              <h1 className="mb-4 max-w-6xl text-3xl font-bold tracking-[-0.03em] text-white md:text-4xl">
                Специальные условия<br />для бизнеса
              </h1>
              <p className="text-white/70 text-base max-w-lg">
                Подбор по MPN, индивидуальное коммерческое предложение и согласование условий поставки.
                Работаем с производителями, интеграторами и дистрибьюторами.
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[1380px] space-y-9 px-3 py-8 sm:px-6">

          {/* Cooperation steps */}
          <section>
            <h2 className="text-xl font-bold text-ink mb-2">Как формируется предложение</h2>
            <p className="text-sm text-ink-3 mb-6">Условия подтверждаются отдельно для каждой спецификации</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {cooperationSteps.map((step, index) => (
                <div
                  key={step.label}
                  className="relative flex flex-col rounded-2xl bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="mb-3 flex size-8 items-center justify-center rounded bg-azure-light text-sm font-bold text-azure">
                    {index + 1}
                  </div>
                  <h3 className="mb-1 text-sm font-semibold text-ink">{step.label}</h3>
                  <p className="text-xs leading-relaxed text-ink-3">{step.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Benefits */}
          <section>
            <h2 className="text-xl font-bold text-ink mb-6">Преимущества оптовых клиентов</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {benefits.map((b) => (
                <div key={b.title} className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className={`flex size-10 items-center justify-center rounded ${b.bg}`}>
                    <b.icon size={18} className={b.color} />
                  </div>
                  <h3 className="text-sm font-semibold text-ink">{b.title}</h3>
                  <p className="text-xs text-ink-3 leading-relaxed">{b.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Conditions + Form */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Conditions */}
            <section>
              <h2 className="text-xl font-bold text-ink mb-6">Условия сотрудничества</h2>
              <div className="space-y-3 rounded-2xl bg-white p-6 shadow-sm">
                {conditions.map((c) => (
                  <div key={c} className="flex items-start gap-3">
                    <div className="flex size-5 items-center justify-center rounded-sm bg-azure/10 shrink-0 mt-0.5">
                      <Check size={11} className="text-azure" />
                    </div>
                    <span className="text-sm text-[#44403c]">{c}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl bg-azure-light p-5">
                <h3 className="text-sm font-semibold text-ink mb-2">Нужна срочная поставка?</h3>
                <p className="text-xs text-ink-3 mb-3">
                  Позвоните нам - менеджер уточнит задачу и доступные варианты поставки.
                </p>
                <a
                  href={`tel:${COMPANY.phone.raw}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-azure hover:underline"
                >
                  <Phone size={14} />
                  {COMPANY.phone.display}
                </a>
              </div>
            </section>

            {/* Form */}
            <section>
              <h2 className="text-xl font-bold text-ink mb-6">Оставить заявку</h2>
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                {submitted ? (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center size-14 rounded bg-azure/10 mb-4">
                      <CheckCircle2 size={28} className="text-azure" />
                    </div>
                    <h3 className="text-base font-bold text-ink mb-2">Заявка отправлена!</h3>
                    <p className="text-sm text-ink-3">
                      Менеджер свяжется с вами, чтобы уточнить позиции и условия поставки.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="wholesale-name" className="block text-xs font-medium text-[#44403c] mb-1.5">Имя *</label>
                        <div className="relative">
                          <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" />
                          <input
                            id="wholesale-name"
                            name="name"
                            type="text"
                            value={form.name}
                            onChange={(e) => set('name', e.target.value)}
                            placeholder="Иван Иванов"
                            className="w-full h-10 pl-9 pr-4 text-sm bg-azure-light border border-black/8 rounded text-ink placeholder:text-ink-4 outline-none focus:border-azure/40 focus:ring-2 focus:ring-azure/10 transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="wholesale-company" className="block text-xs font-medium text-[#44403c] mb-1.5">Компания</label>
                        <div className="relative">
                          <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" />
                          <input
                            id="wholesale-company"
                            name="company"
                            type="text"
                            value={form.company}
                            onChange={(e) => set('company', e.target.value)}
                            placeholder="ООО «Название»"
                            className="w-full h-10 pl-9 pr-4 text-sm bg-azure-light border border-black/8 rounded text-ink placeholder:text-ink-4 outline-none focus:border-azure/40 focus:ring-2 focus:ring-azure/10 transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="wholesale-email" className="block text-xs font-medium text-[#44403c] mb-1.5">Email *</label>
                      <div className="relative">
                        <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" />
                        <input
                          id="wholesale-email"
                          name="email"
                          type="email"
                          value={form.email}
                          onChange={(e) => set('email', e.target.value)}
                          placeholder="your@company.ru"
                          className="w-full h-10 pl-9 pr-4 text-sm bg-azure-light border border-black/8 rounded text-ink placeholder:text-ink-4 outline-none focus:border-azure/40 focus:ring-2 focus:ring-azure/10 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="wholesale-phone" className="block text-xs font-medium text-[#44403c] mb-1.5">Телефон *</label>
                      <div className="relative">
                        <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" />
                        <input
                          id="wholesale-phone"
                          name="phone"
                          type="tel"
                          value={form.phone}
                          onChange={(e) => set('phone', e.target.value)}
                          placeholder="+7 (999) 000-00-00"
                          className="w-full h-10 pl-9 pr-4 text-sm bg-azure-light border border-black/8 rounded text-ink placeholder:text-ink-4 outline-none focus:border-azure/40 focus:ring-2 focus:ring-azure/10 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="wholesale-message" className="block text-xs font-medium text-[#44403c] mb-1.5">Сообщение</label>
                      <div className="relative">
                        <MessageSquare size={14} className="absolute left-3 top-3 text-ink-4" />
                        <textarea
                          id="wholesale-message"
                          name="message"
                          value={form.message}
                          onChange={(e) => set('message', e.target.value)}
                          placeholder="Опишите ваши потребности: какие компоненты, объём, сроки..."
                          rows={3}
                          className="w-full pl-9 pr-4 py-2.5 text-sm bg-azure-light border border-black/8 rounded text-ink placeholder:text-ink-4 outline-none focus:border-azure/40 focus:ring-2 focus:ring-azure/10 transition-all resize-none"
                        />
                      </div>
                    </div>

                    <label htmlFor="wholesale-consent" className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        id="wholesale-consent"
                        name="consent"
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        className="mt-0.5 size-4 shrink-0 accent-azure"
                      />
                      <span className="text-xs text-ink-3 leading-relaxed">
                        Я соглашаюсь на обработку персональных данных в соответствии с{' '}
                        <Link href="/privacy" className="text-azure hover:underline">
                          политикой конфиденциальности
                        </Link>{' '}
                        и{' '}
                        <Link href="/offer" className="text-azure hover:underline">
                          условиями оферты
                        </Link>.
                      </span>
                    </label>

                    {error && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded text-sm text-red-600">
                        <AlertCircle size={14} className="shrink-0" />
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="h-11 w-full rounded-xl bg-azure text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-azure-hover hover:shadow-md active:translate-y-0 disabled:translate-y-0 disabled:opacity-60"
                    >
                      {loading ? 'Отправляем...' : 'Отправить заявку'}
                    </button>
                  </form>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
