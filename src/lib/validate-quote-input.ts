import { type QuoteRequestInput } from '@/app/request-list/actions'

export interface QuoteValidationResult {
  valid: boolean
  error?: string
}

const VALID_STATUSES = ['new', 'in_progress', 'quoted', 'rejected'] as const

// Лимиты против спама и раздувания транзакции — server action это публичный
// POST, клиентской валидации верить нельзя.
export const MAX_FIELD = 200
export const MAX_COMMENT = 2000
export const MAX_ADDRESS = 500
export const MAX_ITEMS = 500
export const MAX_QUANTITY = 1_000_000
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateQuoteInput(input: QuoteRequestInput): QuoteValidationResult {
  // Согласие на ПДн (ФЗ-152): проверяем на сервере, клиентский чекбокс обходится
  if (input.consent !== true) {
    return { valid: false, error: 'Необходимо согласие на обработку персональных данных' }
  }

  if (typeof input.companyName !== 'string' || !input.companyName.trim()) {
    return { valid: false, error: 'Укажите название компании' }
  }
  if (typeof input.contactPerson !== 'string' || !input.contactPerson.trim()) {
    return { valid: false, error: 'Укажите контактное лицо' }
  }
  if (typeof input.phone !== 'string' || !input.phone.trim()) {
    return { valid: false, error: 'Укажите телефон' }
  }
  if (typeof input.email !== 'string' || !input.email.trim()) {
    return { valid: false, error: 'Укажите email' }
  }
  if (
    (input.inn != null && typeof input.inn !== 'string') ||
    (input.comment != null && typeof input.comment !== 'string') ||
    (input.deliveryAddress != null && typeof input.deliveryAddress !== 'string') ||
    (input.desiredDeliveryDate != null && typeof input.desiredDeliveryDate !== 'string')
  ) {
    return { valid: false, error: 'Некорректный формат одного из полей' }
  }

  // Format checks — отсекаем мусорные лиды
  if (!EMAIL_RE.test(input.email.trim())) {
    return { valid: false, error: 'Некорректный email' }
  }
  const phoneDigits = input.phone.replace(/\D/g, '')
  if (phoneDigits.length < 10 || phoneDigits.length > 15) {
    return { valid: false, error: 'Некорректный телефон' }
  }

  // Length limits
  if (
    input.companyName.length > MAX_FIELD ||
    input.contactPerson.length > MAX_FIELD ||
    input.email.length > MAX_FIELD ||
    input.phone.length > MAX_FIELD ||
    (typeof input.inn === 'string' ? input.inn.length : 0) > MAX_FIELD ||
    (typeof input.comment === 'string' ? input.comment.length : 0) > MAX_COMMENT ||
    (typeof input.deliveryAddress === 'string' ? input.deliveryAddress.length : 0) > MAX_ADDRESS
  ) {
    return { valid: false, error: 'Превышена допустимая длина одного из полей' }
  }

  if (!Array.isArray(input.items) || input.items.length < 1) {
    return { valid: false, error: 'Добавьте хотя бы один товар в запрос' }
  }
  if (input.items.length > MAX_ITEMS) {
    return { valid: false, error: `Слишком много позиций (максимум ${MAX_ITEMS})` }
  }
  if (
    input.items.some(
      (item) =>
        !item ||
        typeof item.productId !== 'string' ||
        !item.productId.trim() ||
        item.productId.length > MAX_FIELD ||
        typeof item.partNumber !== 'string' ||
        item.partNumber.length > MAX_FIELD ||
        typeof item.name !== 'string' ||
        item.name.length > MAX_FIELD,
    )
  ) {
    return { valid: false, error: 'Некорректные данные одной из позиций' }
  }
  if (
    input.items.some(
      (item) =>
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > MAX_QUANTITY,
    )
  ) {
    return { valid: false, error: 'Некорректное количество в одной из позиций' }
  }

  const productIds = input.items.map((item) => item.productId)
  if (new Set(productIds).size !== productIds.length) {
    return { valid: false, error: 'Один товар не должен повторяться в заявке' }
  }

  if (input.desiredDeliveryDate) {
    if (
      typeof input.desiredDeliveryDate !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(input.desiredDeliveryDate) ||
      Number.isNaN(new Date(`${input.desiredDeliveryDate}T00:00:00.000Z`).getTime())
    ) {
      return { valid: false, error: 'Некорректная желаемая дата поставки' }
    }
  }

  return { valid: true }
}

export function isValidQuoteStatus(status: string): boolean {
  return (VALID_STATUSES as readonly string[]).includes(status)
}

export { VALID_STATUSES }
