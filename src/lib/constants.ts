import { COMPANY } from '@/lib/company'

// Минимальная сумма заказа для B2B клиентов
export const MIN_ORDER_AMOUNT = 200000 // 200 000 ₽

// Контактная информация — единый источник: src/lib/company.ts
export const CONTACT_PHONE = COMPANY.phone.display
export const CONTACT_EMAIL = COMPANY.email

// Время обработки заявки
export const REQUEST_PROCESSING_TIME = '24 часа'
