'use server'

import { prisma } from '@/lib/prisma'
import { notifyNewQuoteRequest } from '@/lib/notifications'

export interface QuoteRequestInput {
  companyName: string
  inn?: string
  contactPerson: string
  phone: string
  email: string
  comment?: string
  deliveryAddress?: string
  desiredDeliveryDate?: string
  items: Array<{
    productId: string
    partNumber: string
    name: string
    quantity: number
  }>
}

export type QuoteRequestResult =
  | { success: true; requestId: string }
  | { success: false; error: string }

export async function submitQuoteRequest(
  input: QuoteRequestInput,
): Promise<QuoteRequestResult> {
  try {
    // Validate required fields
    if (!input.companyName.trim()) {
      return { success: false, error: 'Укажите название компании' }
    }
    if (!input.contactPerson.trim()) {
      return { success: false, error: 'Укажите контактное лицо' }
    }
    if (!input.phone.trim()) {
      return { success: false, error: 'Укажите телефон' }
    }
    if (!input.email.trim()) {
      return { success: false, error: 'Укажите email' }
    }
    if (!input.items || input.items.length < 1) {
      return { success: false, error: 'Добавьте хотя бы один товар в запрос' }
    }

    // Create QuoteRequest + QuoteRequestItems in a single transaction
    const quoteRequest = await prisma.$transaction(async (tx) => {
      const qr = await tx.quoteRequest.create({
        data: {
          status: 'new',
          companyName: input.companyName.trim(),
          inn: input.inn?.trim() || null,
          contactPerson: input.contactPerson.trim(),
          phone: input.phone.trim(),
          email: input.email.trim(),
          comment: input.comment?.trim() || null,
          deliveryAddress: input.deliveryAddress?.trim() || null,
          desiredDeliveryDate: input.desiredDeliveryDate
            ? new Date(input.desiredDeliveryDate)
            : null,
          items: {
            create: input.items.map((item) => ({
              productId: item.productId,
              partNumber: item.partNumber,
              name: item.name,
              quantity: item.quantity,
            })),
          },
        },
      })
      return qr
    })

    // Уведомление администратору (fail-safe: сбой не ломает заявку)
    await notifyNewQuoteRequest({
      requestId: quoteRequest.id,
      companyName: input.companyName,
      contactPerson: input.contactPerson,
      phone: input.phone,
      email: input.email,
      itemsCount: input.items.length,
      comment: input.comment,
    })

    return { success: true, requestId: quoteRequest.id }
  } catch (error) {
    console.error('[QuoteRequest] Error:', error)
    const message =
      error instanceof Error ? error.message : 'Произошла ошибка при отправке запроса'
    return { success: false, error: message }
  }
}
