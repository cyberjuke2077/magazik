import { describe, expect, it } from 'vitest'
import {
  consumeSubmissionRateLimit,
  SubmissionRateLimitExceededError,
  type SubmissionRateLimitStore,
} from './submission-rate-limit'

function createMemoryStore(): SubmissionRateLimitStore {
  const counters = new Map<string, { count: number; expiresAt: Date }>()

  return {
    async deleteExpired(now) {
      for (const [key, counter] of counters) {
        if (counter.expiresAt < now) counters.delete(key)
      }
    },
    async increment(input) {
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
})
