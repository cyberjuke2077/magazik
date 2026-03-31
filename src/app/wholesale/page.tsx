'use client'

import { useState } from 'react'
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

const priceTiers = [
  { from: 1, to: 99, label: 'Розница', discount: 0, color: 'text-[#78716c]', bg: 'bg-[#e8f4ff]' },
  { from: 100, to: 499, label: 'Мелкий опт', discount: 15, color: 'text-[#f97316]', bg: 'bg-[#f97316]/8' },
  { from: 500, to: 1999, label: 'Средний опт', discount: 25, color: 'text-[#0066cc]', bg: 'bg-[#0066cc]/8' },
  { from: 2000, to: null, label: 'Крупный опт', discount: 40, color: 'text-[#0066cc]', bg: 'bg-[#0066cc]/15' },
]

const benefits = [
  {
    icon: TrendingDown,
    title: 'Скидки до 40%',
    description: 'Прогрессивная система скидок в зависимости от объёма заказа',
    color: 'text-[#0066cc]',
    bg: 'bg-[#0066cc]/8',
  },
  {
    icon: FileText,
    title: 'Полный пакет документов',
    description: 'Счёт, накладная, счёт-фактура, сертификаты качества на все позиции',
    color: 'text-[#f97316]',
    bg: 'bg-[#f97316]/8',
  },
  {
    icon: Package2,
    title: 'Резервирование склада',
    description: 'Резервируем нужные позиции под ваши регулярные заказы',
    color: 'text-[#0066cc]',
    bg: 'bg-[#0066cc]/8',
  },
  {
    icon: Headphones,
    title: 'Персональный менеджер',
    description: 'Выделенный менеджер для оптовых клиентов, помощь с подбором',
    color: 'text-[#f97316]',
    bg: 'bg-[#f97316]/8',
  },
]

const conditions = [
  'Работаем с юридическими лицами и ИП',
  'Оплата по счёту, банковской картой или наличными',
  'Отсрочка платежа для постоянных клиентов',
  'Доставка по всей России и СНГ',
  'Минимальная сумма оптового заказа — 10 000 ₽',
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
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.name || !form.email || !form.phone) {
      setError('Заполните обязательные поля')
      return
    }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
    }, 800)
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <StickyNav />

      <main>
        {/* Breadcrumb */}
        <div className="border-b border-black/8 bg-white">
          <div className="mx-auto max-w-[1400px] px-4 py-3">
            <nav className="flex items-center gap-1.5 text-xs text-[#a8a29e]">
              <Link href="/" className="hover:text-[#78716c] transition-colors">Главная</Link>
              <ChevronRight size={10} />
              <span className="text-[#78716c]">Оптом</span>
            </nav>
          </div>
        </div>

        {/* Hero */}
        <div className="bg-[#0066cc] relative overflow-hidden">
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
          <div className="relative mx-auto max-w-[1400px] px-4 py-14">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/15 border border-white/20 rounded-sm text-xs text-white font-medium mb-5">
                <Package2 size={11} />
                Оптовые поставки
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Специальные условия<br />для бизнеса
              </h1>
              <p className="text-white/70 text-base max-w-lg">
                Скидки до 40%, персональный менеджер, полный пакет документов.
                Работаем с производителями, интеграторами и дистрибьюторами.
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[1400px] px-4 py-12 space-y-14">

          {/* Price tiers */}
          <section>
            <h2 className="text-xl font-bold text-[#1c1917] mb-2">Ценовые уровни</h2>
            <p className="text-sm text-[#78716c] mb-6">Скидка применяется автоматически при достижении порога</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {priceTiers.map((tier) => (
                <div
                  key={tier.label}
                  className={`relative flex flex-col p-5 bg-white border border-black/8 rounded shadow-sm ${
                    tier.discount >= 25 ? 'ring-2 ring-[#0066cc]/20' : ''
                  }`}
                >
                  {tier.discount >= 25 && (
                    <div className="absolute -top-2.5 left-4 px-2.5 py-0.5 bg-[#0066cc] text-white text-[10px] font-semibold rounded-sm">
                      Популярный
                    </div>
                  )}
                  <div className={`inline-flex items-center self-start px-2.5 py-1 rounded text-xs font-semibold mb-3 ${tier.bg} ${tier.color}`}>
                    {tier.label}
                  </div>
                  <div className="text-3xl font-bold text-[#1c1917] mb-1">
                    {tier.discount === 0 ? '—' : `-${tier.discount}%`}
                  </div>
                  <div className="text-xs text-[#78716c]">
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
            <h2 className="text-xl font-bold text-[#1c1917] mb-6">Преимущества оптовых клиентов</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {benefits.map((b) => (
                <div key={b.title} className="flex flex-col gap-3 p-5 bg-white border border-black/8 rounded shadow-sm">
                  <div className={`flex size-10 items-center justify-center rounded ${b.bg}`}>
                    <b.icon size={18} className={b.color} />
                  </div>
                  <h3 className="text-sm font-semibold text-[#1c1917]">{b.title}</h3>
                  <p className="text-xs text-[#78716c] leading-relaxed">{b.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Conditions + Form */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Conditions */}
            <section>
              <h2 className="text-xl font-bold text-[#1c1917] mb-6">Условия сотрудничества</h2>
              <div className="bg-white border border-black/8 rounded shadow-sm p-6 space-y-3">
                {conditions.map((c) => (
                  <div key={c} className="flex items-start gap-3">
                    <div className="flex size-5 items-center justify-center rounded-sm bg-[#0066cc]/10 shrink-0 mt-0.5">
                      <Check size={11} className="text-[#0066cc]" />
                    </div>
                    <span className="text-sm text-[#44403c]">{c}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-5 bg-[#e8f4ff] border border-[#f97316]/15 rounded">
                <h3 className="text-sm font-semibold text-[#1c1917] mb-2">Нужна срочная поставка?</h3>
                <p className="text-xs text-[#78716c] mb-3">
                  Позвоните нам — обсудим условия и сроки в течение 15 минут.
                </p>
                <a
                  href="tel:+78005553535"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#0066cc] hover:underline"
                >
                  <Phone size={14} />
                  +7 (800) 555-35-35
                </a>
              </div>
            </section>

            {/* Form */}
            <section>
              <h2 className="text-xl font-bold text-[#1c1917] mb-6">Оставить заявку</h2>
              <div className="bg-white border border-black/8 rounded shadow-sm p-6">
                {submitted ? (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center size-14 rounded bg-[#0066cc]/10 mb-4">
                      <CheckCircle2 size={28} className="text-[#0066cc]" />
                    </div>
                    <h3 className="text-base font-bold text-[#1c1917] mb-2">Заявка отправлена!</h3>
                    <p className="text-sm text-[#78716c]">
                      Наш менеджер свяжется с вами в течение 2 часов в рабочее время.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[#44403c] mb-1.5">Имя *</label>
                        <div className="relative">
                          <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a8a29e]" />
                          <input
                            type="text"
                            value={form.name}
                            onChange={(e) => set('name', e.target.value)}
                            placeholder="Иван Иванов"
                            className="w-full h-10 pl-9 pr-4 text-sm bg-[#e8f4ff] border border-black/8 rounded text-[#1c1917] placeholder-[#a8a29e] outline-none focus:border-[#0066cc]/40 focus:ring-2 focus:ring-[#0066cc]/10 transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#44403c] mb-1.5">Компания</label>
                        <div className="relative">
                          <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a8a29e]" />
                          <input
                            type="text"
                            value={form.company}
                            onChange={(e) => set('company', e.target.value)}
                            placeholder="ООО «Название»"
                            className="w-full h-10 pl-9 pr-4 text-sm bg-[#e8f4ff] border border-black/8 rounded text-[#1c1917] placeholder-[#a8a29e] outline-none focus:border-[#0066cc]/40 focus:ring-2 focus:ring-[#0066cc]/10 transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#44403c] mb-1.5">Email *</label>
                      <div className="relative">
                        <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a8a29e]" />
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => set('email', e.target.value)}
                          placeholder="your@company.ru"
                          className="w-full h-10 pl-9 pr-4 text-sm bg-[#e8f4ff] border border-black/8 rounded text-[#1c1917] placeholder-[#a8a29e] outline-none focus:border-[#0066cc]/40 focus:ring-2 focus:ring-[#0066cc]/10 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#44403c] mb-1.5">Телефон *</label>
                      <div className="relative">
                        <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a8a29e]" />
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(e) => set('phone', e.target.value)}
                          placeholder="+7 (999) 000-00-00"
                          className="w-full h-10 pl-9 pr-4 text-sm bg-[#e8f4ff] border border-black/8 rounded text-[#1c1917] placeholder-[#a8a29e] outline-none focus:border-[#0066cc]/40 focus:ring-2 focus:ring-[#0066cc]/10 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#44403c] mb-1.5">Сообщение</label>
                      <div className="relative">
                        <MessageSquare size={14} className="absolute left-3 top-3 text-[#a8a29e]" />
                        <textarea
                          value={form.message}
                          onChange={(e) => set('message', e.target.value)}
                          placeholder="Опишите ваши потребности: какие компоненты, объём, сроки..."
                          rows={3}
                          className="w-full pl-9 pr-4 py-2.5 text-sm bg-[#e8f4ff] border border-black/8 rounded text-[#1c1917] placeholder-[#a8a29e] outline-none focus:border-[#0066cc]/40 focus:ring-2 focus:ring-[#0066cc]/10 transition-all resize-none"
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded text-sm text-red-600">
                        <AlertCircle size={14} className="shrink-0" />
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-11 text-sm font-semibold text-white bg-[#0066cc] hover:bg-[#0052a3] disabled:opacity-60 rounded transition-all btn-primary shadow-sm"
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
