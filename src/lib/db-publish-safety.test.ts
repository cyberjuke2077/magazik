import { describe, expect, it } from 'vitest'
import { assertSafePublishUrls, protectedCountsMatch } from './db-publish-safety'

const source = 'postgresql://local:secret@localhost:5432/electromagaz'

describe('assertSafePublishUrls', () => {
  it('accepts distinct source and target databases', () => {
    expect(() =>
      assertSafePublishUrls(
        source,
        'postgresql://publisher:secret@db.example.com:5432/postgres?sslmode=require',
      ),
    ).not.toThrow()
  })

  it('rejects a transaction pooler target', () => {
    expect(() =>
      assertSafePublishUrls(source, 'postgresql://publisher:secret@pooler.example.com:6543/postgres'),
    ).toThrow('session-порт 5432')
  })

  it('rejects pgbouncer mode even on another port', () => {
    expect(() =>
      assertSafePublishUrls(
        source,
        'postgresql://publisher:secret@pooler.example.com:5432/postgres?pgbouncer=true',
      ),
    ).toThrow('без pgbouncer')
  })

  it('rejects source and target pointing to the same database', () => {
    expect(() =>
      assertSafePublishUrls(
        source,
        'postgresql://other-user:other-secret@localhost:5432/electromagaz?schema=public',
      ),
    ).toThrow('не должны указывать на одну БД')
  })
})

describe('protectedCountsMatch', () => {
  const before = { QuoteRequest: 2, QuoteRequestItem: 5, WholesaleLead: 3 }

  it('accepts unchanged customer data counters', () => {
    expect(protectedCountsMatch(before, { ...before })).toBe(true)
  })

  it('detects a change in any protected table', () => {
    expect(protectedCountsMatch(before, { ...before, WholesaleLead: 4 })).toBe(false)
  })
})
