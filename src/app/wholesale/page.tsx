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

const priceTiers = [
  { from: 1, to: 99, label: 'Розница', discount: 0, color: 'text-ink-3', bg: 'bg-azure-light' },
  { from: 100, to: 499, label: 'Мелкий опт', discount: 15, color: 'text-accent', bg: 'bg-accent/8' },
  { from: 500, to: 1999, label: 'Средний опт', discount: 25, color: 'text-azure', bg: 'bg-azure/8' },
  { from: 2000, to: null, label: 'Крупный опт', discount: 40, color: 'text-azure', bg: 'bg-azure/15' },
]

const benefits = [
  {
    icon: TrendingDown,
    title: 'Скидки до 40%',
    description: 'Прогрессивная система скидок в зависимости от объёма заказа',
    color: 'text-azure',
    bg: 'bg-azure/8',
  },
  {
    icon: FileText,
    title: 'Полный пакет документов',
    description: 'Счёт, накладная, счёт-фактура, сертификаты качества на все позиции',
    color: 'text-accent',
    bg: 'bg-accent/8',
  },
  {
    icon: Package2,
    title: 'Резервирование склада',
    description: 'Резервируем нужные позиции под ваши регулярные заказы',
    color: 'text-azure',
    bg: 'bg-azure/8',
  },
  {
    icon: Headphones,
    title: 'Персональный менеджер',
    description: 'Выделенный менеджер для оптовых клиентов, помощь с подбором',
    color: 'text-accent',
    bg: 'bg-accent/8',
  },
]

const conditions = [
  'Работаем с юридическими лицами и ИП',
  'Оплата по счёту, банковской картой или наличными',
  'Отсрочка платежа для постоянных клиентов',
  'Доставка по всей России и СНГ',
  'Минимальная сумма оптового заказа - 10 000 ₽',
  'Возможность заказа под конкретный проект',
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
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[#0b315f]/82" />
          <div className="relative mx-auto max-w-[1380px] px-3 py-10 sm:px-6 sm:py-12">
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-white/82">
                <Package2 size={11} />
                Оптовые поставки
              </div>
              <h1 className="mb-4 max-w-6xl text-3xl font-bold tracking-[-0.03em] text-white md:text-4xl">
                Специальные условия<br />для бизнеса
              </h1>
              <p className="text-white/70 text-base max-w-lg">
                Скидки до 40%, персональный менеджер, полный пакет документов.
                Работаем с производителями, интеграторами и дистрибьюторами.
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[1380px] space-y-9 px-3 py-8 sm:px-6">

          {/* Price tiers */}
          <section>
            <h2 className="text-xl font-bold text-ink mb-2">Ценовые уровни</h2>
            <p className="text-sm text-ink-3 mb-6">Скидка применяется автоматически при достижении порога</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {priceTiers.map((tier) => (
                <div
                  key={tier.label}
                  className={`relative flex flex-col rounded-[var(--radius-card)] border bg-white p-5 ${
                    tier.discount >= 25 ? 'border-azure/35' : 'border-[var(--border)]'
                  }`}
                >
                  {tier.discount >= 25 && (
                    <div className="absolute -top-2.5 left-4 px-2.5 py-0.5 bg-azure text-white text-[10px] font-semibold rounded-sm">
                      Популярный
                    </div>
                  )}
                  <div className={`inline-flex items-center self-start px-2.5 py-1 rounded text-xs font-semibold mb-3 ${tier.bg} ${tier.color}`}>
                    {tier.label}
                  </div>
                  <div className="text-3xl font-bold text-ink mb-1">
                    {tier.discount === 0 ? '-' : `-${tier.discount}%`}
                  </div>
                  <div className="text-xs text-ink-3">
                    {tier.to
                      ? `от ${tier.from} до ${tier.to} шт.`
                      : `от ${tier.from} шт.`}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Benefits */}
          <section>
            <h2 className="text-xl font-bold text-ink mb-6">Преимущества оптовых клиентов</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {benefits.map((b) => (
                <div key={b.title} className="flex flex-col gap-3 border-t border-[var(--border)] py-5">
                  <div className={`flex size-10 items-center justify-center rounded-[var(--radius-control)] ${b.bg}`}>
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
              <div className="space-y-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-white p-6">
                {conditions.map((c) => (
                  <div key={c} className="flex items-start gap-3">
                    <div className="flex size-5 items-center justify-center rounded-sm bg-azure/10 shrink-0 mt-0.5">
                      <Check size={11} className="text-azure" />
                    </div>
                    <span className="text-sm text-[#44403c]">{c}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[var(--radius-card)] border border-azure/14 bg-azure-light p-5">
                <h3 className="text-sm font-semibold text-ink mb-2">Нужна срочная поставка?</h3>
                <p className="text-xs text-ink-3 mb-3">
                  Позвоните нам - обсудим условия и сроки в течение 15 минут.
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
              <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-white p-6">
                {submitted ? (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center size-14 rounded bg-azure/10 mb-4">
                      <CheckCircle2 size={28} className="text-azure" />
                    </div>
                    <h3 className="text-base font-bold text-ink mb-2">Заявка отправлена!</h3>
                    <p className="text-sm text-ink-3">
                      Наш менеджер свяжется с вами в течение 2 часов в рабочее время.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[#44403c] mb-1.5">Имя *</label>
                        <div className="relative">
                          <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" />
                          <input
                            type="text"
                            value={form.name}
                            onChange={(e) => set('name', e.target.value)}
                            placeholder="Иван Иванов"
                            className="w-full h-10 pl-9 pr-4 text-sm bg-azure-light border border-black/8 rounded text-ink placeholder:text-ink-4 outline-none focus:border-azure/40 focus:ring-2 focus:ring-azure/10 transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#44403c] mb-1.5">Компания</label>
                        <div className="relative">
                          <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" />
                          <input
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
                      <label className="block text-xs font-medium text-[#44403c] mb-1.5">Email *</label>
                      <div className="relative">
                        <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" />
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => set('email', e.target.value)}
                          placeholder="your@company.ru"
                          className="w-full h-10 pl-9 pr-4 text-sm bg-azure-light border border-black/8 rounded text-ink placeholder:text-ink-4 outline-none focus:border-azure/40 focus:ring-2 focus:ring-azure/10 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#44403c] mb-1.5">Телефон *</label>
                      <div className="relative">
                        <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" />
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(e) => set('phone', e.target.value)}
                          placeholder="+7 (999) 000-00-00"
                          className="w-full h-10 pl-9 pr-4 text-sm bg-azure-light border border-black/8 rounded text-ink placeholder:text-ink-4 outline-none focus:border-azure/40 focus:ring-2 focus:ring-azure/10 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#44403c] mb-1.5">Сообщение</label>
                      <div className="relative">
                        <MessageSquare size={14} className="absolute left-3 top-3 text-ink-4" />
                        <textarea
                          value={form.message}
                          onChange={(e) => set('message', e.target.value)}
                          placeholder="Опишите ваши потребности: какие компоненты, объём, сроки..."
                          rows={3}
                          className="w-full pl-9 pr-4 py-2.5 text-sm bg-azure-light border border-black/8 rounded text-ink placeholder:text-ink-4 outline-none focus:border-azure/40 focus:ring-2 focus:ring-azure/10 transition-all resize-none"
                        />
                      </div>
                    </div>

                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
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
                      className="h-11 w-full rounded-[var(--radius-control)] bg-azure text-sm font-bold text-white transition-colors hover:bg-azure-hover active:translate-y-px disabled:translate-y-0 disabled:opacity-60"
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
