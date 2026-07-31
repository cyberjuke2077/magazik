'use server'

import { prisma } from '@/lib/prisma'
import { notifyNewQuoteRequest } from '@/lib/notifications'
import { validateQuoteInput } from '@/lib/validate-quote-input'
import {
  enforceSubmissionRateLimit,
  SubmissionRateLimitExceededError,
} from '@/lib/submission-rate-limit'
import { logSubmissionEvent } from '@/lib/submission-log'

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
  const startedAt = Date.now()
  try {
    // Единая серверная валидация (согласие ПДн, форматы, лимиты).
    const validation = validateQuoteInput(input)
    if (!validation.valid) {
      logSubmissionEvent({
        scope: 'quote_request',
        outcome: 'rejected_validation',
        durationMs: Date.now() - startedAt,
      })
      return { success: false, error: validation.error ?? 'Некорректные данные' }
    }

    await enforceSubmissionRateLimit('quote_request', input.email)

    const productIds = input.items.map((item) => item.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, partNumber: true, name: true },
    })
    if (products.length !== productIds.length) {
      logSubmissionEvent({
        scope: 'quote_request',
        outcome: 'rejected_validation',
        durationMs: Date.now() - startedAt,
      })
      return {
        success: false,
        error: 'Один из товаров больше недоступен. Обновите корзину и повторите попытку.',
      }
    }
    const productsById = new Map(products.map((product) => [product.id, product]))

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
            create: input.items.map((item) => {
              const product = productsById.get(item.productId)
              if (!product) throw new Error('Validated product is missing')
              return {
                productId: product.id,
                partNumber: product.partNumber,
                name: product.name,
                quantity: item.quantity,
              }
            }),
          },
        },
      })
      return qr
    })

    // Уведомление администратору (fail-safe: сбой не ломает заявку)
    const notification = await notifyNewQuoteRequest({
      requestId: quoteRequest.id,
      companyName: input.companyName,
      contactPerson: input.contactPerson,
      phone: input.phone,
      email: input.email,
      itemsCount: input.items.length,
      comment: input.comment,
    })

    logSubmissionEvent({
      scope: 'quote_request',
      outcome: 'saved',
      requestId: quoteRequest.id,
      durationMs: Date.now() - startedAt,
      notificationStatus: notification.status,
    })

    return { success: true, requestId: quoteRequest.id }
  } catch (error) {
    if (error instanceof SubmissionRateLimitExceededError) {
      logSubmissionEvent({
        scope: 'quote_request',
        outcome: 'rejected_rate_limit',
        durationMs: Date.now() - startedAt,
      })
      return { success: false, error: 'Слишком много попыток. Повторите позже.' }
    }

    logSubmissionEvent({
      scope: 'quote_request',
      outcome: 'failed',
      durationMs: Date.now() - startedAt,
      errorType: error instanceof Error ? error.name : 'UnknownError',
    })
    return { success: false, error: 'Не удалось сохранить заявку. Повторите попытку позже.' }
  }
}
