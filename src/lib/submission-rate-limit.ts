import { createHash } from 'node:crypto'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'

export type SubmissionScope =
  | 'quote_request'
  | 'wholesale_lead'
  | 'quote_request_attempt_network'
  | 'wholesale_lead_attempt_network'
  | 'admin_login_global'
  | 'admin_login_network'
  | 'admin_login_account'

export type PublicSubmissionScope = 'quote_request' | 'wholesale_lead'

const DEFAULT_LIMIT = 10
const DEFAULT_WINDOW_MS = 15 * 60 * 1000
const ADMIN_GLOBAL_LIMIT = 500
const ADMIN_NETWORK_LIMIT = 10
const ADMIN_ACCOUNT_LIMIT = 50
const SUBMISSION_ATTEMPT_NETWORK_LIMIT = 60

interface CounterInput {
  key: string
  scope: SubmissionScope
  windowStart: Date
  expiresAt: Date
}

export interface SubmissionRateLimitStore {
  deleteExpired(now: Date): Promise<void>
  increment(input: CounterInput): Promise<number>
}

interface ConsumeOptions {
  scope: SubmissionScope
  identity: string
  now?: Date
  limit?: number
  windowMs?: number
  cleanup?: boolean
}

interface AdminLoginLimitOptions {
  now?: Date
  windowMs?: number
  globalLimit?: number
  networkLimit?: number
  accountLimit?: number
}

interface SubmissionAttemptLimitOptions {
  now?: Date
  windowMs?: number
  networkLimit?: number
}

export class SubmissionRateLimitExceededError extends Error {
  constructor() {
    super('Submission rate limit exceeded')
    this.name = 'SubmissionRateLimitExceededError'
  }
}

const prismaStore: SubmissionRateLimitStore = {
  async deleteExpired(now) {
    await prisma.submissionRateLimit.deleteMany({ where: { expiresAt: { lt: now } } })
  },
  async increment(input) {
    const counter = await prisma.submissionRateLimit.upsert({
      where: { key: input.key },
      create: { ...input, count: 1 },
      update: { count: { increment: 1 } },
      select: { count: true },
    })
    return counter.count
  },
}

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

export async function consumeSubmissionRateLimit(
  options: ConsumeOptions,
  store: SubmissionRateLimitStore = prismaStore,
): Promise<void> {
  const now = options.now ?? new Date()
  const limit = options.limit ?? DEFAULT_LIMIT
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS

  if (!options.identity.trim()) throw new Error('Rate-limit identity is required')
  if (!Number.isInteger(limit) || limit < 1) throw new Error('Rate-limit must be a positive integer')
  if (!Number.isFinite(windowMs) || windowMs < 1000) throw new Error('Rate-limit window is invalid')

  const bucket = Math.floor(now.getTime() / windowMs)
  const windowStart = new Date(bucket * windowMs)
  const expiresAt = new Date(windowStart.getTime() + windowMs)
  const key = digest(`${options.scope}:${bucket}:${digest(options.identity)}`)

  if (options.cleanup !== false) await store.deleteExpired(now)
  const count = await store.increment({ key, scope: options.scope, windowStart, expiresAt })
  if (count > limit) throw new SubmissionRateLimitExceededError()
}

function firstForwardedAddress(value: string | null): string | null {
  const first = value?.split(',')[0]?.trim()
  return first || null
}

async function requestNetworkIdentity(): Promise<string | null> {
  const requestHeaders = await headers()
  return firstForwardedAddress(requestHeaders.get('x-vercel-forwarded-for'))
    || firstForwardedAddress(requestHeaders.get('x-forwarded-for'))
    || requestHeaders.get('x-real-ip')?.trim()
    || null
}

export async function consumeSubmissionAttemptRateLimits(
  scope: PublicSubmissionScope,
  networkIdentity: string | null,
  store: SubmissionRateLimitStore = prismaStore,
  options: SubmissionAttemptLimitOptions = {},
): Promise<void> {
  const normalizedNetwork = networkIdentity?.trim().slice(0, 200) || '<unavailable>'
  const shared = { now: options.now, windowMs: options.windowMs }

  await consumeSubmissionRateLimit({
    ...shared,
    scope: `${scope}_attempt_network`,
    identity: `network:${normalizedNetwork}`,
    limit: options.networkLimit ?? SUBMISSION_ATTEMPT_NETWORK_LIMIT,
  }, store)
}

export async function consumeAdminLoginRateLimits(
  username: string,
  networkIdentity: string | null,
  store: SubmissionRateLimitStore = prismaStore,
  options: AdminLoginLimitOptions = {},
): Promise<void> {
  const normalizedUsername = username.trim().toLowerCase().slice(0, 200) || '<empty>'
  const normalizedNetwork = networkIdentity?.trim().slice(0, 200) || '<unavailable>'
  const shared = { now: options.now, windowMs: options.windowMs }

  await consumeSubmissionRateLimit({
    ...shared,
    scope: 'admin_login_global',
    identity: 'admin-login',
    limit: options.globalLimit ?? ADMIN_GLOBAL_LIMIT,
  }, store)
  await consumeSubmissionRateLimit({
    ...shared,
    scope: 'admin_login_network',
    identity: `network:${normalizedNetwork}`,
    limit: options.networkLimit ?? ADMIN_NETWORK_LIMIT,
    cleanup: false,
  }, store)
  await consumeSubmissionRateLimit({
    ...shared,
    scope: 'admin_login_account',
    identity: `account:${normalizedUsername}`,
    limit: options.accountLimit ?? ADMIN_ACCOUNT_LIMIT,
    cleanup: false,
  }, store)
}

export async function enforceAdminLoginRateLimit(username: string): Promise<void> {
  await consumeAdminLoginRateLimits(username, await requestNetworkIdentity())
}

export async function enforceSubmissionAttemptRateLimit(
  scope: PublicSubmissionScope,
): Promise<void> {
  await consumeSubmissionAttemptRateLimits(scope, await requestNetworkIdentity())
}

export async function enforceSubmissionRateLimit(
  scope: SubmissionScope,
  fallbackContact: string,
): Promise<void> {
  const networkIdentity = await requestNetworkIdentity()
  const normalizedContact = fallbackContact.trim().toLowerCase()
  const identity = networkIdentity
    ? `network:${networkIdentity}`
    : `contact:${normalizedContact}`

  await consumeSubmissionRateLimit({ scope, identity })
}
