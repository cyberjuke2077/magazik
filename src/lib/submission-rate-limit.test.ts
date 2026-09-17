import { describe, expect, it } from 'vitest'
import {
  consumeAdminLoginRateLimits,
  consumeSubmissionRateLimit,
  SubmissionRateLimitExceededError,
  type SubmissionRateLimitStore,
} from './submission-rate-limit'

function createMemoryStore(onIncrement?: (scope: string) => void): SubmissionRateLimitStore {
  const counters = new Map<string, { count: number; expiresAt: Date }>()

  return {
    async deleteExpired(now) {
      for (const [key, counter] of counters) {
        if (counter.expiresAt < now) counters.delete(key)
      }
    },
    async increment(input) {
      onIncrement?.(input.scope)
      const existing = counters.get(input.key)
      const count = (existing?.count ?? 0) + 1
      counters.set(input.key, { count, expiresAt: input.expiresAt })
      return count
    },
  }
}

describe('submission rate limit', () => {
  it('allows requests up to the configured limit and rejects the next one', async () => {
    const store = createMemoryStore()
    const options = {
      scope: 'quote_request' as const,
      identity: 'network:127.0.0.1',
      now: new Date('2026-07-31T12:00:00.000Z'),
      limit: 2,
      windowMs: 60_000,
    }

    await expect(consumeSubmissionRateLimit(options, store)).resolves.toBeUndefined()
    await expect(consumeSubmissionRateLimit(options, store)).resolves.toBeUndefined()
    await expect(consumeSubmissionRateLimit(options, store)).rejects.toBeInstanceOf(
      SubmissionRateLimitExceededError,
    )
  })

  it('uses a fresh counter in the next time window', async () => {
    const store = createMemoryStore()
    const base = {
      scope: 'wholesale_lead' as const,
      identity: 'contact:test@local.test',
      limit: 1,
      windowMs: 60_000,
    }

    await consumeSubmissionRateLimit(
      { ...base, now: new Date('2026-07-31T12:00:00.000Z') },
      store,
    )
    await expect(
      consumeSubmissionRateLimit(
        { ...base, now: new Date('2026-07-31T12:01:00.000Z') },
        store,
      ),
    ).resolves.toBeUndefined()
  })

  it('limits one admin account even when forwarded addresses change', async () => {
    const store = createMemoryStore()
    const options = {
      now: new Date('2026-07-31T12:00:00.000Z'),
      windowMs: 60_000,
      globalLimit: 100,
      networkLimit: 100,
      accountLimit: 2,
    }

    await consumeAdminLoginRateLimits('Admin', '198.51.100.1', store, options)
    await consumeAdminLoginRateLimits('admin', '198.51.100.2', store, options)
    await expect(
      consumeAdminLoginRateLimits(' ADMIN ', '198.51.100.3', store, options),
    ).rejects.toBeInstanceOf(SubmissionRateLimitExceededError)
  })

  it('stops before creating account buckets after the network limit', async () => {
    const increments: string[] = []
    const store = createMemoryStore((scope) => increments.push(scope))
    const options = {
      now: new Date('2026-07-31T12:00:00.000Z'),
      windowMs: 60_000,
      globalLimit: 100,
      networkLimit: 2,
      accountLimit: 100,
    }

    await consumeAdminLoginRateLimits('one', '198.51.100.1', store, options)
    await consumeAdminLoginRateLimits('two', '198.51.100.1', store, options)
    await expect(
      consumeAdminLoginRateLimits('three', '198.51.100.1', store, options),
    ).rejects.toBeInstanceOf(SubmissionRateLimitExceededError)
    expect(increments.filter((scope) => scope === 'admin_login_account')).toHaveLength(2)
  })

  it('bounds dynamic network and account buckets with a fixed global bucket', async () => {
    const increments: string[] = []
    const store = createMemoryStore((scope) => increments.push(scope))
    const options = {
      now: new Date('2026-07-31T12:00:00.000Z'),
      windowMs: 60_000,
      globalLimit: 2,
      networkLimit: 100,
      accountLimit: 100,
    }

    await consumeAdminLoginRateLimits('one', '198.51.100.1', store, options)
    await consumeAdminLoginRateLimits('two', '198.51.100.2', store, options)
    await expect(
      consumeAdminLoginRateLimits('three', '198.51.100.3', store, options),
    ).rejects.toBeInstanceOf(SubmissionRateLimitExceededError)
    expect(increments.filter((scope) => scope === 'admin_login_network')).toHaveLength(2)
    expect(increments.filter((scope) => scope === 'admin_login_account')).toHaveLength(2)
  })
})
