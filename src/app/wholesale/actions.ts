'use server'

import { after } from 'next/server'
import { drainNotifications } from '@/lib/notification-outbox'

import { saveSubmission, SubmissionConflictError } from '@/lib/save-submission'
import { validateWholesaleInput } from '@/lib/validate-wholesale-input'
import {
  enforceSubmissionRateLimit,
  SubmissionRateLimitExceededError,
} from '@/lib/submission-rate-limit'
import { logSubmissionEvent } from '@/lib/submission-log'

export interface WholesaleLeadInput {
  submissionKey?: string
  name: string
  company?: string
  phone: string
  email: string
  message?: string
  consent: boolean
}

export type WholesaleLeadResult =
  | { success: true }
  | { success: false; error: string }

export async function submitWholesaleLead(
  input: WholesaleLeadInput,
): Promise<WholesaleLeadResult> {
  const startedAt = Date.now()
  try {
    // Единая серверная валидация (согласие ПДн, форматы, лимиты).
    const validation = validateWholesaleInput(input)
    if (!validation.valid) {
      logSubmissionEvent({
        scope: 'wholesale_lead',
        outcome: 'rejected_validation',
        durationMs: Date.now() - startedAt,
      })
      return { success: false, error: validation.error ?? 'Некорректные данные' }
    }

    await enforceSubmissionRateLimit('wholesale_lead', input.email)

    const requestId = await saveSubmission(input.submissionKey, 'wholesale', input, (tx) => tx.wholesaleLead.create({
      data: {
        status: 'new',
        name: input.name.trim(),
        company: input.company?.trim() || null,
        phone: input.phone.trim(),
        email: input.email.trim(),
        message: input.message?.trim() || null,
        consentAt: new Date(),
      },
    }))

    after(async () => {
      try { await drainNotifications(2) }
      catch { console.error('[notification-outbox] Background drain failed; jobs remain queued') }
    })

    logSubmissionEvent({
      scope: 'wholesale_lead',
      outcome: 'saved',
      requestId,
      durationMs: Date.now() - startedAt,
      notificationStatus: 'queued',
    })

    return { success: true }
  } catch (error) {
    if (error instanceof SubmissionConflictError) return { success: false, error: error.message }
    if (error instanceof SubmissionRateLimitExceededError) {
      logSubmissionEvent({
        scope: 'wholesale_lead',
        outcome: 'rejected_rate_limit',
        durationMs: Date.now() - startedAt,
      })
      return { success: false, error: 'Слишком много попыток. Повторите позже.' }
    }

    logSubmissionEvent({
      scope: 'wholesale_lead',
      outcome: 'failed',
      durationMs: Date.now() - startedAt,
      errorType: error instanceof Error ? error.name : 'UnknownError',
    })
    return { success: false, error: 'Не удалось сохранить заявку. Повторите попытку позже.' }
  }
}
