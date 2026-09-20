'use client'

import { useEffect, useState } from 'react'
import { rememberRequest } from '@/lib/request-history'
import {
  clearSubmissionDraft,
  finishSubmission,
  loadSubmissionDraft,
  loadPendingSubmission,
  newSubmissionKey,
  onSubmissionStateExpired,
  saveSubmissionDraft,
  submissionKey,
  SubmissionPayloadChangedError,
} from '@/lib/submission-key'
import Link from 'next/link'
import {
  ChevronRight,
  ArrowLeft,
  Building2,
  FileText,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'
import { useCart } from '@/hooks/use-cart'
import { cartUnitPrice } from '@/lib/cart-pricing'
import { formatPrice } from '@/lib/utils'
import { lookupQuoteRequest, submitQuoteRequest, type QuoteRequestInput } from '@/app/request-list/actions'
import { CartUpdateNotice } from '@/components/cart/cart-update-notice'
import { currentBusinessDate } from '@/lib/delivery-date'
import type { CartItem } from '@/types'

const QUOTE_SCOPE = 'quote'
const EMPTY_QUOTE_FORM = {
  companyName: '',
  inn: '',
  contactPerson: '',
  phone: '',
  email: '',
  comment: '',
  desiredDeliveryDate: '',
  deliveryAddress: '',
}
type QuoteForm = typeof EMPTY_QUOTE_FORM
type QuotePayload = Omit<QuoteRequestInput, 'submissionKey'>
type ResolutionState = 'lookup' | 'choose' | null

function isQuoteDraft(value: unknown): value is QuoteForm {
  if (!value || typeof value !== 'object') return false
  const draft = value as Partial<QuoteForm>
  return Object.keys(EMPTY_QUOTE_FORM).every((key) => (
    typeof draft[key as keyof QuoteForm] === 'string'
  ))
}

function isQuotePayload(value: unknown): value is QuotePayload {
  if (!value || typeof value !== 'object') return false
  const payload = value as Partial<QuotePayload>
  const itemsValid = Array.isArray(payload.items) && payload.items.every((item) => (
    !!item && typeof item.productId === 'string' && typeof item.partNumber === 'string'
    && typeof item.name === 'string' && typeof item.quantity === 'number'
  ))
  return typeof payload.companyName === 'string' && typeof payload.contactPerson === 'string'
    && typeof payload.phone === 'string' && typeof payload.email === 'string'
    && typeof payload.consent === 'boolean' && itemsValid
}

function hasQuoteDraftData(value: QuoteForm): boolean {
  return Object.values(value).some((field) => field.trim().length > 0)
}

export default function RequestQuotePage() {
  const {
    items, totalPrice, unpricedItems, mounted, removeSubmittedItems, changes,
    refreshError, isRefreshing, refresh, dismissChanges,
  } = useCart({ refreshProducts: true })

  const [formData, setFormData] = useState<QuoteForm>(EMPTY_QUOTE_FORM)
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [consent, setConsent] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [draftReady, setDraftReady] = useState(false)
  const [minimumDeliveryDate, setMinimumDeliveryDate] = useState('')
  const [resolutionState, setResolutionState] = useState<ResolutionState>(null)
  const [pendingOriginal, setPendingOriginal] = useState<{
    key: string
    payload: QuotePayload
  } | null>(null)

  useEffect(() => {
    const draft = loadSubmissionDraft(QUOTE_SCOPE, isQuoteDraft)
    const pending = loadPendingSubmission(QUOTE_SCOPE, isQuotePayload)
    // Browser-only draft becomes available after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (draft) setFormData(draft)
    if (pending) {
      setPendingOriginal(pending)
      setResolutionState('lookup')
      setSubmitError('Есть незавершённая отправка. Проверьте её статус перед новой заявкой.')
    }
    setDraftReady(true)
  }, [])

  useEffect(() => {
    if (!draftReady) return
    if (hasQuoteDraftData(formData)) saveSubmissionDraft(QUOTE_SCOPE, formData)
    else clearSubmissionDraft(QUOTE_SCOPE)
  }, [draftReady, formData])

  useEffect(() => onSubmissionStateExpired(QUOTE_SCOPE, () => {
    setFormData(EMPTY_QUOTE_FORM)
    setConsent(false)
    setErrors({})
    setPendingOriginal(null)
    setResolutionState(null)
    setSubmitError('Срок хранения черновика истёк. Контактные данные очищены.')
  }), [])

  useEffect(() => {
    // The page is statically rendered, so the current date must be set in the browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMinimumDeliveryDate(currentBusinessDate())
  }, [])

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

  function canSubmit() {
    setSubmitError(null)

    if (isRefreshing) {
      setSubmitError('Дождитесь проверки актуальных цен и минимальных партий')
      return false
    }
    if (refreshError) {
      setSubmitError('Сначала обновите цены и минимальные партии в корзине')
      return false
    }
    if (changes.length > 0) {
      setSubmitError('Просмотрите изменения корзины и нажмите «Понятно» перед отправкой')
      return false
    }

    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return false
    }
    if (!consent) {
      setSubmitError('Подтвердите согласие на обработку персональных данных')
      return false
    }
    return true
  }

  async function refreshBeforeMutation(): Promise<CartItem[] | null> {
    if (changes.length > 0) {
      setSubmitError('Просмотрите изменения корзины и нажмите «Понятно» перед отправкой')
      return null
    }
    const result = await refresh()
    if (!result.ok) {
      setSubmitError('Не удалось проверить актуальные цены и минимальные партии')
      return null
    }
    if (result.changes.length > 0) {
      setSubmitError('Условия в корзине изменились. Просмотрите их и нажмите «Понятно»')
      return null
    }
    if (result.items.length === 0) {
      setSubmitError('После проверки корзина пуста. Добавьте товары и повторите отправку.')
      return null
    }
    return result.items
  }

  async function sendSubmission(forceNew = false) {
    setIsSubmitting(true)
    let operationKey: string | null = null
    try {
      const currentItems = await refreshBeforeMutation()
      if (!currentItems) return
      setResolutionState(null)
      setPendingOriginal(null)
      const payload = {
        companyName: formData.companyName,
        inn: formData.inn || undefined,
        contactPerson: formData.contactPerson,
        phone: formData.phone,
        email: formData.email,
        comment: formData.comment || undefined,
        deliveryAddress: formData.deliveryAddress || undefined,
        desiredDeliveryDate: formData.desiredDeliveryDate || undefined,
        consent,
        items: currentItems.map((item) => ({
          productId: item.product.id,
          partNumber: item.product.partNumber,
          name: item.product.name,
          quantity: item.quantity,
        })),
      }
      operationKey = forceNew
        ? await newSubmissionKey(QUOTE_SCOPE, payload)
        : await submissionKey(QUOTE_SCOPE, payload)
      const result = await submitQuoteRequest({ ...payload, submissionKey: operationKey })

      if (result.success) {
        rememberRequest(result.requestId, 'quote')
        finishSubmission(QUOTE_SCOPE, operationKey)
        clearSubmissionDraft(QUOTE_SCOPE)
        setPendingOriginal(null)
        await removeSubmittedItems(currentItems)
        // Полная навигация не даёт пустой корзине перерисовать страницу раньше
        // перехода на статус успешно сохранённой заявки.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign(`/request-quote/status/${result.requestId}`)
      } else {
        if (result.discardOperation && operationKey) finishSubmission(QUOTE_SCOPE, operationKey)
        setSubmitError(result.error)
      }
    } catch (caught) {
      if (caught instanceof SubmissionPayloadChangedError && isQuotePayload(caught.originalPayload)) {
        setResolutionState('lookup')
        setPendingOriginal({ key: caught.operationKey, payload: caught.originalPayload })
        setSubmitError('Предыдущая отправка могла сохраниться. Изменённые данные не отправлены. Сначала проверьте её статус.')
      } else {
        setSubmitError('Связь прервалась. Черновик сохранён в этой вкладке. Не меняйте данные и повторите отправку, чтобы проверить исходную заявку.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (canSubmit()) await sendSubmission()
  }

  function openPreviousReceipt(requestId: string, operationKey: string) {
    rememberRequest(requestId, 'quote')
    finishSubmission(QUOTE_SCOPE, operationKey)
    // Текущие изменённые поля и корзина остаются черновиком новой заявки.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(`/request-quote/status/${requestId}`)
  }

  async function checkPreviousSubmission() {
    if (!pendingOriginal) return
    setIsSubmitting(true)
    try {
      const result = await lookupQuoteRequest({
        ...pendingOriginal.payload,
        submissionKey: pendingOriginal.key,
      })
      if (!result.success) {
        setSubmitError(result.error)
        return
      }
      if (result.requestId) {
        openPreviousReceipt(result.requestId, pendingOriginal.key)
        return
      }
      setResolutionState('choose')
      setSubmitError('Предыдущая заявка пока не найдена. Исходная отправка могла ещё обрабатываться. Можно повторить её или отправить изменённые данные новой заявкой, но новая заявка может создать второе обращение.')
    } catch {
      setSubmitError('Не удалось проверить статус предыдущей отправки. Повторите проверку позже.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function repeatPreviousSubmission() {
    if (!pendingOriginal) return
    setIsSubmitting(true)
    try {
      const currentItems = items
      const result = await submitQuoteRequest({
        ...pendingOriginal.payload,
        submissionKey: pendingOriginal.key,
      })
      if (result.success) {
        const originalQuantities = new Map(
          pendingOriginal.payload.items.map((item) => [item.productId, item.quantity]),
        )
        await removeSubmittedItems(currentItems.filter((item) => (
          originalQuantities.get(item.product.id) === item.quantity
        )))
        openPreviousReceipt(result.requestId, pendingOriginal.key)
      }
      else setSubmitError(result.error)
    } catch {
      setSubmitError('Связь прервалась. Повторите исходную отправку с тем же ключом операции.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function sendChangedAsNew() {
    if (canSubmit()) await sendSubmission(true)
  }

  // Skeleton while hydrating
  if (!mounted) {
    return (
      <div className="flex min-h-screen flex-col bg-canvas">
        <Header />
        <StickyNav />
        <main className="flex-1 py-6">
          <div className="mx-auto max-w-5xl px-3 sm:px-6">
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

  // Пустой список
  if (items.length === 0 && !pendingOriginal) {
    return (
      <div className="flex min-h-screen flex-col bg-canvas">
        <Header />
        <StickyNav />
        <main className="flex-1 py-12">
          <div className="mx-auto max-w-md px-3 text-center sm:px-6">
            <CartUpdateNotice changes={changes} error={refreshError} isRefreshing={isRefreshing} onRetry={refresh} onDismiss={dismissChanges} />
            <div className="border border-[var(--border)] bg-white p-8 shadow-[var(--shadow-xs)]">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#f8fafc] mb-4">
                <FileText size={32} className="text-ink-4" />
              </div>
              <h1 className="text-xl font-bold text-ink mb-2">
                Корзина пуста
              </h1>
              <p className="text-sm text-ink-3 mb-6">
                Добавьте товары в корзину, чтобы перейти к оформлению.
              </p>
              <Link
                href="/catalog"
                className="inline-flex h-10 items-center gap-2 rounded bg-accent px-6 text-sm font-bold text-white transition-colors hover:bg-accent-hover"
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
    <div className="flex min-h-screen flex-col bg-canvas">
      <Header />
      <StickyNav />
      
      <main className="flex-1 py-5">
        {/* Breadcrumb */}
        <div className="mx-auto mb-4 max-w-5xl px-3 sm:px-6">
          <nav className="flex items-center gap-1.5 text-xs text-ink-4">
            <Link href="/" className="hover:text-ink-3 transition-colors">Главная</Link>
            <ChevronRight size={10} />
            <Link href="/cart" className="hover:text-ink-3 transition-colors">Корзина</Link>
            <ChevronRight size={10} />
            <span className="text-ink-3">Оформление</span>
          </nav>
        </div>

        <div className="mx-auto max-w-5xl px-3 sm:px-6">
          <div className="mb-5">
            <h1 className="text-2xl font-bold text-ink mb-2">
              Запрос коммерческого предложения
            </h1>
            <p className="text-sm text-ink-3">
              Укажите контактные данные. Менеджер свяжется с вами, чтобы подтвердить цены и сроки поставки.
            </p>
          </div>

          <CartUpdateNotice changes={changes} error={refreshError} isRefreshing={isRefreshing} onRetry={refresh} onDismiss={dismissChanges} />

          <form aria-busy={isSubmitting || isRefreshing || !draftReady} onSubmit={handleSubmit} className="space-y-4">
            <fieldset disabled={isSubmitting || isRefreshing || !draftReady} className="contents">
            {/* Контактная информация */}
            <div className="rounded-2xl bg-white p-4 shadow-[var(--shadow-xs)] sm:p-5">
              <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-ink">
                <Building2 size={20} className="text-azure" />
                Контактная информация
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-ink-2 mb-1.5">
                    Название компании <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => handleChange('companyName', e.target.value)}
                    placeholder="ООО «Электроника»"
                    className={`w-full h-11 px-3 text-sm border rounded ${
                      errors.companyName ? 'border-red-300 bg-red-50' : 'border-[var(--border-2)]'
                    } text-ink placeholder:text-ink-4 outline-none focus:border-azure focus:ring-2 focus:ring-azure/10 transition-all`}
                  />
                  {errors.companyName && (
                    <p className="text-xs text-red-600 mt-1">{errors.companyName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="inn" className="block text-sm font-medium text-ink-2 mb-1.5">
                    ИНН <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="inn"
                    name="inn"
                    type="text"
                    value={formData.inn}
                    onChange={(e) => handleChange('inn', e.target.value)}
                    placeholder="10 или 12 цифр"
                    maxLength={12}
                    className={`w-full h-11 px-3 text-sm border rounded ${
                      errors.inn ? 'border-red-300 bg-red-50' : 'border-[var(--border-2)]'
                    } text-ink placeholder:text-ink-4 outline-none focus:border-azure focus:ring-2 focus:ring-azure/10 transition-all`}
                  />
                  {errors.inn && (
                    <p className="text-xs text-red-600 mt-1">{errors.inn}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="contactPerson" className="block text-sm font-medium text-ink-2 mb-1.5">
                    Контактное лицо <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="contactPerson"
                    name="contactPerson"
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => handleChange('contactPerson', e.target.value)}
                    placeholder="Иван Петров"
                    className={`w-full h-11 px-3 text-sm border rounded ${
                      errors.contactPerson ? 'border-red-300 bg-red-50' : 'border-[var(--border-2)]'
                    } text-ink placeholder:text-ink-4 outline-none focus:border-azure focus:ring-2 focus:ring-azure/10 transition-all`}
                  />
                  {errors.contactPerson && (
                    <p className="text-xs text-red-600 mt-1">{errors.contactPerson}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-ink-2 mb-1.5">
                    Телефон <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+7 (999) 123-45-67"
                    className={`w-full h-11 px-3 text-sm border rounded ${
                      errors.phone ? 'border-red-300 bg-red-50' : 'border-[var(--border-2)]'
                    } text-ink placeholder:text-ink-4 outline-none focus:border-azure focus:ring-2 focus:ring-azure/10 transition-all`}
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="email" className="block text-sm font-medium text-ink-2 mb-1.5">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="email@company.ru"
                    className={`w-full h-11 px-3 text-sm border rounded ${
                      errors.email ? 'border-red-300 bg-red-50' : 'border-[var(--border-2)]'
                    } text-ink placeholder:text-ink-4 outline-none focus:border-azure focus:ring-2 focus:ring-azure/10 transition-all`}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-600 mt-1">{errors.email}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Детали запроса */}
            <div className="rounded-2xl bg-white p-4 shadow-[var(--shadow-xs)] sm:p-5">
              <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-ink">
                <FileText size={20} className="text-azure" />
                Детали заказа
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="comment" className="block text-sm font-medium text-ink-2 mb-1.5">
                    Комментарий к заказу
                  </label>
                  <textarea
                    id="comment"
                    name="comment"
                    value={formData.comment}
                    onChange={(e) => handleChange('comment', e.target.value)}
                    placeholder="Укажите дополнительные пожелания или требования к заказу"
                    rows={4}
                    className="w-full px-3 py-2 text-sm border border-[var(--border-2)] rounded text-ink placeholder:text-ink-4 outline-none focus:border-azure focus:ring-2 focus:ring-azure/10 transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="desiredDeliveryDate" className="block text-sm font-medium text-ink-2 mb-1.5">
                      Желаемая дата поставки
                    </label>
                    <input
                      id="desiredDeliveryDate"
                      name="desiredDeliveryDate"
                      type="date"
                      value={formData.desiredDeliveryDate}
                      onChange={(e) => handleChange('desiredDeliveryDate', e.target.value)}
                      min={minimumDeliveryDate || undefined}
                      className="w-full h-11 px-3 text-sm border border-[var(--border-2)] rounded text-ink outline-none focus:border-azure focus:ring-2 focus:ring-azure/10 transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="deliveryAddress" className="block text-sm font-medium text-ink-2 mb-1.5">
                      Адрес доставки
                    </label>
                    <input
                      id="deliveryAddress"
                      name="deliveryAddress"
                      type="text"
                      value={formData.deliveryAddress}
                      onChange={(e) => handleChange('deliveryAddress', e.target.value)}
                      placeholder="Москва, ул. Ленина, д. 1"
                      className="w-full h-11 px-3 text-sm border border-[var(--border-2)] rounded text-ink placeholder:text-ink-4 outline-none focus:border-azure focus:ring-2 focus:ring-azure/10 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Список товаров */}
            <div className="rounded-2xl bg-white p-4 shadow-[var(--shadow-xs)] sm:p-5">
              <h2 className="mb-4 text-base font-bold text-ink">
                Товары в корзине ({items.length})
              </h2>
              
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.product.id} className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-0">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-ink">{item.product.name}</div>
                      <div className="text-xs text-ink-3 mt-0.5">
                        {item.product.partNumber} / {item.product.manufacturer}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm font-semibold text-ink">
                        {item.quantity} × {cartUnitPrice(item.product, item.quantity) === null ? 'По запросу' : formatPrice(cartUnitPrice(item.product, item.quantity)!)}
                      </div>
                      <div className="text-xs text-ink-3 mt-0.5">
                        = {cartUnitPrice(item.product, item.quantity) === null ? 'По запросу' : formatPrice(cartUnitPrice(item.product, item.quantity)! * item.quantity)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                <span className="text-base font-semibold text-ink-2">Предварительная сумма:</span>
                <span className="text-2xl font-bold text-ink">{unpricedItems ? 'По запросу' : formatPrice(totalPrice)}</span>
              </div>

              <div className="mt-4 border-l-4 border-azure bg-azure-light p-3">
                <p className="text-xs leading-relaxed text-ink-2">
                  <strong>Обратите внимание:</strong> Указанная сумма является предварительной. 
                  Окончательная стоимость будет согласована с вами после формирования коммерческого предложения.
                </p>
              </div>
            </div>

            {/* Согласие на обработку ПДн (152-ФЗ) */}
            <label htmlFor="consent" className="flex items-start gap-3 cursor-pointer">
              <input
                id="consent"
                name="consent"
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-azure"
              />
              <span className="text-sm text-ink-3 leading-relaxed">
                Я даю согласие на обработку моих персональных данных в соответствии с{' '}
                <Link href="/privacy" target="_blank" className="text-azure hover:underline">
                  политикой конфиденциальности
                </Link>
              </span>
            </label>

            {submitError && (
              <div className="space-y-3 bg-red-50 p-3 text-sm text-red-700 border border-red-200 rounded" role="alert">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{submitError}</span>
                </div>
                {resolutionState === 'lookup' && (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => void checkPreviousSubmission()}
                    className="rounded border border-red-300 bg-white px-3 py-2 text-xs font-semibold text-red-700"
                  >
                    Проверить статус предыдущей отправки
                  </button>
                )}
                {resolutionState === 'choose' && (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => void repeatPreviousSubmission()}
                      className="rounded border border-red-300 bg-white px-3 py-2 text-xs font-semibold text-red-700"
                    >
                      Повторить исходную отправку
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => void sendChangedAsNew()}
                      className="rounded bg-red-700 px-3 py-2 text-xs font-semibold text-white"
                    >
                      Отправить изменённые данные новой заявкой
                    </button>
                  </div>
                )}
              </div>
            )}

            <p className="text-xs leading-relaxed text-ink-4">
              Контакты, черновик и снимок незавершённой отправки хранятся только в этой вкладке до 2 часов. Завершённая операция удаляется после подтверждения, а несохранённые изменения могут остаться новым черновиком.
            </p>

            {/* Кнопки */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
              <Link
                href="/cart"
                className="flex h-11 items-center gap-2 rounded-xl border border-[var(--border-2)] bg-white px-5 text-sm font-semibold text-ink-2 transition-colors hover:bg-surface-muted"
              >
                <ArrowLeft size={14} />
                Назад в корзину
              </Link>
              
              <button
                type="submit"
                disabled={isSubmitting || isRefreshing || Boolean(refreshError) || changes.length > 0}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-azure text-sm font-bold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-azure-hover active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {isSubmitting || isRefreshing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {isSubmitting ? 'Отправка...' : 'Проверяем корзину...'}
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Отправить заявку
                  </>
                )}
              </button>
            </div>
            </fieldset>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}
