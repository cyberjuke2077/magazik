'use server'

import { createQuote } from '@/lib/create-quote'
import { after } from 'next/server'
import { drainNotifications } from '@/lib/notification-outbox'

import { lookupSubmission, saveSubmission, SubmissionConflictError } from '@/lib/save-submission'
import { validateQuoteInput } from '@/lib/validate-quote-input'
import {
  enforceSubmissionAttemptRateLimit,
  enforceSubmissionRateLimit,
  SubmissionRateLimitExceededError,
} from '@/lib/submission-rate-limit'
import { logSubmissionEvent } from '@/lib/submission-log'

export interface QuoteRequestInput {
  submissionKey?: string
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
  | { success: false; error: string; discardOperation?: true }

export type QuoteRequestLookupResult =
  | { success: true; requestId: string | null }
  | { success: false; error: string }

export async function lookupQuoteRequest(
  input: QuoteRequestInput,
): Promise<QuoteRequestLookupResult> {
  try {
    await enforceSubmissionAttemptRateLimit('quote_request')
    const validation = validateQuoteInput(input)
    // An invalid payload could not have created a receipt, so the corrected
    // form may safely start a new operation instead of getting stuck on lookup.
    if (!validation.valid) return { success: true, requestId: null }
    const requestId = await lookupSubmission(input.submissionKey, 'quote', input)
    return { success: true, requestId }
  } catch (error) {
    if (error instanceof SubmissionRateLimitExceededError) {
      return { success: false, error: 'Слишком много проверок. Повторите позже.' }
    }
    return { success: false, error: 'Не удалось проверить предыдущую отправку. Повторите позже.' }
  }
}

export async function submitQuoteRequest(
  input: QuoteRequestInput,
): Promise<QuoteRequestResult> {
  const startedAt = Date.now()
  try {
    await enforceSubmissionAttemptRateLimit('quote_request')
    // Единая серверная валидация (согласие ПДн, форматы, лимиты).
    const validation = validateQuoteInput(input)
    if (!validation.valid) {
      logSubmissionEvent({
        scope: 'quote_request',
        outcome: 'rejected_validation',
        durationMs: Date.now() - startedAt,
      })
      return {
        success: false,
        error: validation.error ?? 'Некорректные данные',
        discardOperation: true,
      }
    }

    const previousRequestId = await lookupSubmission(input.submissionKey, 'quote', input)
    if (previousRequestId) return { success: true, requestId: previousRequestId }

    await enforceSubmissionRateLimit('quote_request', input.email)

    const requestId = await saveSubmission(input.submissionKey, 'quote', input, (tx) => createQuote(tx, input))

    after(async () => {
      try { await drainNotifications(2) }
      catch { console.error('[notification-outbox] Background drain failed; jobs remain queued') }
    })

    logSubmissionEvent({
      scope: 'quote_request',
      outcome: 'saved',
      requestId,
      durationMs: Date.now() - startedAt,
      notificationStatus: 'queued',
    })

    return { success: true, requestId }
  } catch (error) {
    if (error instanceof SubmissionConflictError) return { success: false, error: error.message }
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
