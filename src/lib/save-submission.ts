import { createHash } from 'node:crypto'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export class SubmissionConflictError extends Error {}
export type SubmissionKind = 'quote' | 'wholesale'

function validKey(key: string | undefined): key is string {
  return !!key && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value && typeof value === 'object') {
    return JSON.stringify(Object.fromEntries(Object.entries(value)
      .filter(([, item]) => item !== undefined).sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => [key, canonical(item)])))
  }
  return JSON.stringify(value) ?? 'null'
}

function submissionHash(payload: unknown) {
  return createHash('sha256').update(canonical(payload)).digest('hex')
}

export async function lookupSubmission(
  key: string | undefined,
  kind: SubmissionKind,
  payload: unknown,
): Promise<string | null> {
  if (!validKey(key)) return null
  const receipt = await prisma.submissionReceipt.findUnique({ where: { key } })
  if (!receipt || receipt.kind !== kind || receipt.hash !== submissionHash(payload)) return null
  return receipt.requestId
}

export async function saveSubmission(
  key: string | undefined, kind: SubmissionKind, payload: unknown,
  create: (tx: Prisma.TransactionClient) => Promise<{ id: string }>,
): Promise<string> {
  if (!validKey(key)) {
    throw new SubmissionConflictError('Обновите страницу и повторите отправку')
  }
  const hash = submissionHash(payload)
  const existing = async () => {
    const receipt = await prisma.submissionReceipt.findUnique({ where: { key } })
    if (receipt && (receipt.hash !== hash || receipt.kind !== kind)) {
      throw new SubmissionConflictError('Данные заявки изменились. Повторите отправку с обновлённой формой.')
    }
    return receipt?.requestId
  }
  const previous = await existing()
  if (previous) return previous
  try {
    return await prisma.$transaction(async (tx) => {
      const request = await create(tx)
      await tx.submissionReceipt.create({ data: { key, kind, hash, requestId: request.id } })
      await tx.notificationJob.create({ data: { kind, requestId: request.id } })
      return request.id
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const winner = await existing()
      if (winner) return winner
    }
    throw error
  }
}
