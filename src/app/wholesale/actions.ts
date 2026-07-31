'use server'

import { prisma } from '@/lib/prisma'
import { notifyNewWholesaleLead } from '@/lib/notifications'
import { validateWholesaleInput } from '@/lib/validate-wholesale-input'
import {
  enforceSubmissionRateLimit,
  SubmissionRateLimitExceededError,
} from '@/lib/submission-rate-limit'
import { logSubmissionEvent } from '@/lib/submission-log'

export interface WholesaleLeadInput {
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

    const lead = await prisma.wholesaleLead.create({
      data: {
        status: 'new',
        name: input.name.trim(),
        company: input.company?.trim() || null,
        phone: input.phone.trim(),
        email: input.email.trim(),
        message: input.message?.trim() || null,
        consentAt: new Date(),
      },
    })

    // Уведомление администратору (fail-safe: сбой не ломает сохранение лида)
    const notification = await notifyNewWholesaleLead({
      leadId: lead.id,
      name: input.name,
      company: input.company,
      phone: input.phone,
      email: input.email,
      message: input.message,
    })

    logSubmissionEvent({
      scope: 'wholesale_lead',
      outcome: 'saved',
      requestId: lead.id,
      durationMs: Date.now() - startedAt,
      notificationStatus: notification.status,
    })

    return { success: true }
  } catch (error) {
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
