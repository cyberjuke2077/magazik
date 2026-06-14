'use server'

import { prisma } from '@/lib/prisma'
import { notifyNewQuoteRequest } from '@/lib/notifications'
import { validateQuoteInput } from '@/lib/validate-quote-input'

export interface QuoteRequestInput {
  companyName: string
  inn?: string
  contactPerson: string
  phone: string
  email: string
  comment?: string
  deliveryAddress?: string
  desiredDeliveryDate?: string
  consent: boolean
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
    // Единая серверная валидация (согласие ПДн, форматы, лимиты).
    const validation = validateQuoteInput(input)
    if (!validation.valid) {
      return { success: false, error: validation.error ?? 'Некорректные данные' }
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
          consentAt: new Date(),
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
