import { randomUUID } from 'node:crypto'
import type { NotificationJob } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { notifyNewQuoteRequest, notifyNewWholesaleLead, type NotificationDelivery } from '@/lib/notifications'

async function claimJob(): Promise<NotificationJob | undefined> {
  const token = randomUUID()
  const rows = await prisma.$queryRaw<NotificationJob[]>`
    UPDATE "NotificationJob" SET status = 'sending', "lockToken" = ${token},
      "lockedUntil" = NOW() + INTERVAL '1 minute', attempts = attempts + 1, "updatedAt" = NOW()
    WHERE id = (SELECT id FROM "NotificationJob"
      WHERE (status = 'pending' AND "nextAttempt" <= NOW())
        OR (status = 'sending' AND "lockedUntil" < NOW())
      ORDER BY "createdAt", id FOR UPDATE SKIP LOCKED LIMIT 1)
    RETURNING *`
  return rows[0]
}

async function deliver(job: NotificationJob): Promise<NotificationDelivery> {
  if (job.kind === 'quote') {
    const request = await prisma.quoteRequest.findUnique({ where: { id: job.requestId },
      select: { _count: { select: { items: true } } } })
    if (!request) return { status: 'failed', errorType: 'RequestMissing' }
    return notifyNewQuoteRequest({ requestId: job.requestId, itemsCount: request._count.items })
  }
  if (job.kind !== 'wholesale') return { status: 'failed', errorType: 'UnknownKind' }
  return notifyNewWholesaleLead({ leadId: job.requestId })
}

async function finish(job: NotificationJob, result: NotificationDelivery) {
  const sent = result.status === 'sent'
  const status = sent ? 'sent' : job.attempts >= 8 ? 'failed' : 'pending'
  const delay = Math.min(3600, 30 * 2 ** Math.min(job.attempts, 7))
  await prisma.notificationJob.updateMany({
    where: { id: job.id, lockToken: job.lockToken, status: 'sending' },
    data: { status, lockToken: null, lockedUntil: null,
      nextAttempt: new Date(Date.now() + delay * 1000),
      lastError: sent ? null : result.status === 'failed' ? result.errorType : 'NotConfigured' },
  })
}

export async function drainNotifications(limit = 10): Promise<number> {
  let processed = 0
  for (; processed < Math.min(limit, 50); processed++) {
    const job = await claimJob()
    if (!job) break
    let result: NotificationDelivery
    try { result = await deliver(job) }
    catch (error) { result = { status: 'failed', errorType: error instanceof Error ? error.name : 'UnknownError' } }
    await finish(job, result)
  }
  return processed
}
