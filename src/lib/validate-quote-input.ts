import { type QuoteRequestInput } from '@/app/request-list/actions'

export interface QuoteValidationResult {
  valid: boolean
  error?: string
}

const VALID_STATUSES = ['new', 'in_progress', 'quoted', 'rejected'] as const

export function validateQuoteInput(input: QuoteRequestInput): QuoteValidationResult {
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
  if (!input.items || input.items.length < 1) {
    return { valid: false, error: 'Добавьте хотя бы один товар в запрос' }
  }

  return { valid: true }
}

export function isValidQuoteStatus(status: string): boolean {
  return (VALID_STATUSES as readonly string[]).includes(status)
}

export { VALID_STATUSES }
