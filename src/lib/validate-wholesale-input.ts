import { type WholesaleLeadInput } from '@/app/wholesale/actions'

export interface WholesaleValidationResult {
  valid: boolean
  error?: string
}

// Лимиты против спама — server action это публичный POST, клиентской
// валидации верить нельзя.
const MAX_FIELD = 200
const MAX_MESSAGE = 2000
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateWholesaleInput(input: WholesaleLeadInput): WholesaleValidationResult {
  // Согласие на ПДн (ФЗ-152): проверяем на сервере, клиентский чекбокс обходится
  if (!input.consent) {
    return { valid: false, error: 'Необходимо согласие на обработку персональных данных' }
  }

  if (!input.name?.trim()) {
    return { valid: false, error: 'Укажите имя' }
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
    input.name.length > MAX_FIELD ||
    (input.company?.length ?? 0) > MAX_FIELD ||
    input.email.length > MAX_FIELD ||
    input.phone.length > MAX_FIELD ||
    (input.message?.length ?? 0) > MAX_MESSAGE
  ) {
    return { valid: false, error: 'Превышена допустимая длина одного из полей' }
  }

  return { valid: true }
}
