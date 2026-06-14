'use server'

import { prisma } from '@/lib/prisma'
import { notifyNewWholesaleLead } from '@/lib/notifications'
import { validateWholesaleInput } from '@/lib/validate-wholesale-input'

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
  try {
    // Единая серверная валидация (согласие ПДн, форматы, лимиты).
    const validation = validateWholesaleInput(input)
    if (!validation.valid) {
      return { success: false, error: validation.error ?? 'Некорректные данные' }
    }

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
    await notifyNewWholesaleLead({
      leadId: lead.id,
      name: input.name,
      company: input.company,
      phone: input.phone,
      email: input.email,
      message: input.message,
    })

    return { success: true }
  } catch (error) {
    console.error('[WholesaleLead] Error:', error)
    const message =
      error instanceof Error ? error.message : 'Произошла ошибка при отправке заявки'
    return { success: false, error: message }
  }
}
