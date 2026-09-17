import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { prisma } from '@/lib/prisma'
import { saveSubmission } from '@/lib/save-submission'
import { drainNotifications } from '@/lib/notification-outbox'
import { submitQuoteRequest } from '@/app/request-list/actions'
import { buildPrefixTsQuery } from '@/lib/search-query'

const { notify } = vi.hoisted(() => ({ notify: vi.fn() }))
vi.mock('@/lib/notifications', () => ({ notifyNewQuoteRequest: notify, notifyNewWholesaleLead: notify }))
vi.mock('next/server', () => ({ after: vi.fn() }))
vi.mock('@/lib/submission-rate-limit', () => ({ enforceSubmissionRateLimit: vi.fn(), SubmissionRateLimitExceededError: class extends Error {} }))
const marker = `readiness-${randomUUID()}`
const keys: string[] = []
let localDatabaseVerified = false
const lead = { name: marker, phone: '79990000000', email: 'test@example.invalid', consentAt: new Date() }
const key = () => { const value = randomUUID(); keys.push(value); return value }

beforeAll(() => {
  const url = new URL(process.env.DATABASE_URL ?? '')
  if (!['localhost', '127.0.0.1'].includes(url.hostname) || url.pathname !== '/emg_readiness') {
    throw new Error('Readiness tests require the isolated local emg_readiness database')
  }
  localDatabaseVerified = true
})
afterAll(async () => {
  if (!localDatabaseVerified) return
  const receipts = await prisma.submissionReceipt.findMany({ where: { key: { in: keys } } })
  await prisma.notificationJob.deleteMany({ where: { requestId: { in: receipts.map((item) => item.requestId) } } })
  await prisma.submissionReceipt.deleteMany({ where: { key: { in: keys } } })
  await prisma.wholesaleLead.deleteMany({ where: { name: marker } })
  await prisma.$disconnect()
})

it('two concurrent submissions create exactly one request and one notification; replay returns its ID', async () => {
  const id = key()
  const create = () => saveSubmission(id, 'wholesale', lead, (tx) => tx.wholesaleLead.create({ data: lead }))
  const [one, two] = await Promise.all([create(), create()])
  expect(one).toBe(two)
  expect(await create()).toBe(one)
  expect(await prisma.wholesaleLead.count({ where: { name: marker } })).toBe(1)
  expect(await prisma.notificationJob.count({ where: { requestId: one } })).toBe(1)
  await expect(saveSubmission(id, 'wholesale', { ...lead, name: 'changed' }, (tx) => tx.wholesaleLead.create({ data: lead })))
    .rejects.toThrow('изменились')
})

it('rolls back the request if the transaction fails before receipt/outbox creation', async () => {
  const id = key()
  const before = await prisma.wholesaleLead.count({ where: { name: marker } })
  await expect(saveSubmission(id, 'wholesale', lead, async (tx) => {
    await tx.wholesaleLead.create({ data: lead })
    throw new Error('simulated transaction failure')
  })).rejects.toThrow('simulated')
  expect(await prisma.wholesaleLead.count({ where: { name: marker } })).toBe(before)
  expect(await prisma.submissionReceipt.findUnique({ where: { key: id } })).toBeNull()
})

it('failed delivery stays durable and parallel workers do not deliver the same claim twice', async () => {
  // This isolated database is used only by this suite, before browser tests.
  await prisma.notificationJob.updateMany({ data: { status: 'sent' } })
  const id = await saveSubmission(key(), 'wholesale', lead, (tx) => tx.wholesaleLead.create({ data: lead }))
  notify.mockResolvedValueOnce({ status: 'failed', errorType: 'TimeoutError' })
  await drainNotifications(1)
  const pending = await prisma.notificationJob.findFirstOrThrow({ where: { requestId: id } })
  expect(pending).toMatchObject({ status: 'pending', attempts: 1, lastError: 'TimeoutError' })
  await prisma.notificationJob.update({ where: { id: pending.id }, data: { nextAttempt: new Date(0) } })
  notify.mockResolvedValue({ status: 'sent' })
  const before = notify.mock.calls.length
  await Promise.all([drainNotifications(1), drainNotifications(1)])
  expect(notify.mock.calls.length - before).toBe(1)
  expect(await prisma.notificationJob.findUnique({ where: { id: pending.id } })).toMatchObject({ status: 'sent', attempts: 2 })
})

it('validates search punctuation and MPN syntax against PostgreSQL', async () => {
  for (const query of ['!!', 'OPA/123', 'AD1580ARTZ-REEL7', 'OPA+123', "test' | !\\", 'тест модуль']) {
    const tsquery = buildPrefixTsQuery(query)
    if (tsquery) await expect(prisma.$queryRaw`SELECT to_tsquery('simple', ${tsquery})::text`).resolves.toBeDefined()
  }
})

it('rejects a quantity below the current database minimum without persisting a request', async () => {
  const product = await prisma.product.findFirst({ where: { minOrder: { gt: 1 } } })
  if (!product) throw new Error('Seed the isolated database before the readiness suite')
  const result = await submitQuoteRequest({ submissionKey: key(), companyName: 'Test', contactPerson: 'Buyer',
    phone: '79990000000', email: 'test@example.invalid', consent: true,
    items: [{ productId: product.id, partNumber: product.partNumber, name: product.name, quantity: 1 }] })
  expect(result.success).toBe(false)
  if (!result.success) expect(result.error).toContain('Минимальная партия')
})
