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
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateQuoteInput(input: QuoteRequestInput): QuoteValidationResult {
  // Согласие на ПДн (ФЗ-152): проверяем на сервере, клиентский чекбокс обходится
  if (!input.consent) {
    return { valid: false, error: 'Необходимо согласие на обработку персональных данных' }
  }

  if (!input.companyName?.trim()) {
    return { valid: false, error: 'Укажите название компании' }
  }
  if (!input.contactPerson?.trim()) {
    return { valid: false, error: 'Укажите контактное лицо' }
  }
  if (!input.phone?.trim()) {
    return { valid: false, error: 'Укажите телефон' }
  }
  if (!input.email?.trim()) {
    return { valid: false, error: 'Укажите email' }
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
    (input.inn?.length ?? 0) > MAX_FIELD ||
    (input.comment?.length ?? 0) > MAX_COMMENT ||
    (input.deliveryAddress?.length ?? 0) > MAX_ADDRESS
  ) {
    return { valid: false, error: 'Превышена допустимая длина одного из полей' }
  }

  if (!input.items || input.items.length < 1) {
    return { valid: false, error: 'Добавьте хотя бы один товар в запрос' }
  }
  if (input.items.length > MAX_ITEMS) {
    return { valid: false, error: `Слишком много позиций (максимум ${MAX_ITEMS})` }
  }
  if (input.items.some((i) => !Number.isFinite(i.quantity) || i.quantity < 1)) {
    return { valid: false, error: 'Некорректное количество в одной из позиций' }
  }

  return { valid: true }
}

export function isValidQuoteStatus(status: string): boolean {
  return (VALID_STATUSES as readonly string[]).includes(status)
}

export { VALID_STATUSES }
