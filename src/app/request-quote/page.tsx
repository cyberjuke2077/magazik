'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ChevronRight,
  ArrowLeft,
  Building2,
  User,
  Mail,
  Phone,
  FileText,
  Calendar,
  MapPin,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'
import { useCart } from '@/hooks/use-cart'
import { useAuth } from '@/hooks/use-auth'
import { formatPrice } from '@/lib/utils'
import { MIN_ORDER_AMOUNT } from '@/lib/constants'

export default function RequestQuotePage() {
  const router = useRouter()
  const { items, totalPrice, mounted } = useCart()
  const { user } = useAuth()
  
  const [formData, setFormData] = useState({
    companyName: user?.companyName || '',
    inn: user?.inn || '',
    contactPerson: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    comment: '',
    desiredDeliveryDate: '',
    deliveryAddress: '',
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(field: string, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Очистить ошибку при изменении
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  function validate() {
    const newErrors: Record<string, string> = {}
    
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Укажите название компании'
    }
    
    if (!formData.inn.trim()) {
      newErrors.inn = 'Укажите ИНН'
    } else if (!/^\d{10}$|^\d{12}$/.test(formData.inn)) {
      newErrors.inn = 'ИНН должен содержать 10 или 12 цифр'
    }
    
    if (!formData.contactPerson.trim()) {
      newErrors.contactPerson = 'Укажите контактное лицо'
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Укажите телефон'
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Укажите email'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Некорректный email'
    }
    
    return newErrors
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setIsSubmitting(true)
    
    // Имитация отправки запроса
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // TODO: Отправить на backend
    console.log('Запрос на КП:', {
      ...formData,
      items,
      totalPrice,
    })
    
    // Перенаправить на страницу успеха
    router.push('/request-quote/success')
  }

  // Skeleton while hydrating
  if (!mounted) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Header />
        <StickyNav />
        <main className="flex-1 bg-gray-50 py-8">
          <div className="mx-auto max-w-4xl px-4">
            <div className="h-8 w-64 bg-gray-200 rounded mb-6 animate-pulse" />
            <div className="bg-white rounded-lg p-6 space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Проверка минимальной суммы
  if (totalPrice < MIN_ORDER_AMOUNT) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Header />
        <StickyNav />
        <main className="flex-1 bg-gray-50 py-20">
          <div className="mx-auto max-w-md px-4 text-center">
            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-50 mb-4">
                <AlertCircle size={32} className="text-orange-500" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                Минимальная сумма не достигнута
              </h1>
              <p className="text-sm text-gray-600 mb-6">
                Минимальная сумма заказа — {formatPrice(MIN_ORDER_AMOUNT)}.
                Добавьте товаров ещё на {formatPrice(MIN_ORDER_AMOUNT - totalPrice)}.
              </p>
              <Link
                href="/cart"
                className="inline-flex items-center gap-2 h-10 px-6 text-sm font-semibold text-white bg-[#0066cc] hover:bg-[#0052a3] rounded transition-colors"
              >
                <ArrowLeft size={14} />
                Вернуться к списку
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Пустой список
  if (items.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Header />
        <StickyNav />
        <main className="flex-1 bg-gray-50 py-20">
          <div className="mx-auto max-w-md px-4 text-center">
            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
                <FileText size={32} className="text-gray-300" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                Список запроса пуст
              </h1>
              <p className="text-sm text-gray-600 mb-6">
                Добавьте товары в список для формирования запроса на коммерческое предложение.
              </p>
              <Link
                href="/catalog"
                className="inline-flex items-center gap-2 h-10 px-6 text-sm font-semibold text-white bg-[#0066cc] hover:bg-[#0052a3] rounded transition-colors"
              >
                Перейти в каталог
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <StickyNav />
      
      <main className="flex-1 bg-gray-50 py-8">
        {/* Breadcrumb */}
        <div className="mx-auto max-w-4xl px-4 mb-6">
          <nav className="flex items-center gap-1.5 text-xs text-gray-400">
            <Link href="/" className="hover:text-gray-600 transition-colors">Главная</Link>
            <ChevronRight size={10} />
            <Link href="/cart" className="hover:text-gray-600 transition-colors">Список запроса</Link>
            <ChevronRight size={10} />
            <span className="text-gray-600">Запрос на КП</span>
          </nav>
        </div>

        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Запрос коммерческого предложения
            </h1>
            <p className="text-sm text-gray-600">
              Заполните форму, и мы свяжемся с вами в течение 24 часов для согласования цены и сроков поставки
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Контактная информация */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 size={20} className="text-[#0066cc]" />
                Контактная информация
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Название компании <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => handleChange('companyName', e.target.value)}
                    placeholder="ООО «Электроника»"
                    className={`w-full h-11 px-3 text-sm border rounded ${
                      errors.companyName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    } text-gray-900 placeholder-gray-400 outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/10 transition-all`}
                  />
                  {errors.companyName && (
                    <p className="text-xs text-red-600 mt-1">{errors.companyName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    ИНН <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.inn}
                    onChange={(e) => handleChange('inn', e.target.value)}
                    placeholder="7707083893"
                    maxLength={12}
                    className={`w-full h-11 px-3 text-sm border rounded ${
                      errors.inn ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    } text-gray-900 placeholder-gray-400 outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/10 transition-all`}
                  />
                  {errors.inn && (
                    <p className="text-xs text-red-600 mt-1">{errors.inn}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Контактное лицо <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => handleChange('contactPerson', e.target.value)}
                    placeholder="Иван Петров"
                    className={`w-full h-11 px-3 text-sm border rounded ${
                      errors.contactPerson ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    } text-gray-900 placeholder-gray-400 outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/10 transition-all`}
                  />
                  {errors.contactPerson && (
                    <p className="text-xs text-red-600 mt-1">{errors.contactPerson}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Телефон <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+7 (999) 123-45-67"
                    className={`w-full h-11 px-3 text-sm border rounded ${
                      errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    } text-gray-900 placeholder-gray-400 outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/10 transition-all`}
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="email@company.ru"
                    className={`w-full h-11 px-3 text-sm border rounded ${
                      errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    } text-gray-900 placeholder-gray-400 outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/10 transition-all`}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-600 mt-1">{errors.email}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Детали запроса */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-[#0066cc]" />
                Детали запроса
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Комментарий к заказу
                  </label>
                  <textarea
                    value={formData.comment}
                    onChange={(e) => handleChange('comment', e.target.value)}
                    placeholder="Укажите дополнительные пожелания или требования к заказу"
                    rows={4}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded text-gray-900 placeholder-gray-400 outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/10 transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Желаемая дата поставки
                    </label>
                    <input
                      type="date"
                      value={formData.desiredDeliveryDate}
                      onChange={(e) => handleChange('desiredDeliveryDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full h-11 px-3 text-sm border border-gray-300 rounded text-gray-900 outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/10 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Адрес доставки
                    </label>
                    <input
                      type="text"
                      value={formData.deliveryAddress}
                      onChange={(e) => handleChange('deliveryAddress', e.target.value)}
                      placeholder="Москва, ул. Ленина, д. 1"
                      className="w-full h-11 px-3 text-sm border border-gray-300 rounded text-gray-900 placeholder-gray-400 outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/10 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Список товаров */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Товары в запросе ({items.length})
              </h2>
              
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.product.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{item.product.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {item.product.partNumber} · {item.product.manufacturer}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm font-semibold text-gray-900">
                        {item.quantity} × {formatPrice(item.product.price)}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        = {formatPrice(item.product.price * item.quantity)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span className="text-base font-semibold text-gray-700">Предварительная сумма:</span>
                <span className="text-2xl font-bold text-gray-900">{formatPrice(totalPrice)}</span>
              </div>

              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
                <p className="text-xs text-blue-800 leading-relaxed">
                  <strong>Обратите внимание:</strong> Указанная сумма является предварительной. 
                  Окончательная стоимость будет согласована с вами после формирования коммерческого предложения.
                </p>
              </div>
            </div>

            {/* Кнопки */}
            <div className="flex items-center gap-4">
              <Link
                href="/cart"
                className="flex items-center gap-2 h-12 px-6 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded transition-colors"
              >
                <ArrowLeft size={14} />
                Назад к списку
              </Link>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 h-12 text-sm font-semibold text-white bg-[#0066cc] hover:bg-[#0052a3] disabled:bg-gray-300 disabled:cursor-not-allowed rounded transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Отправка...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Отправить запрос на КП
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Нажимая кнопку, вы соглашаетесь с{' '}
              <Link href="/privacy" className="text-[#0066cc] hover:underline">
                политикой конфиденциальности
              </Link>
            </p>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}
