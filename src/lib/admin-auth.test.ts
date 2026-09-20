import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  checkAdminCredentials,
  createSessionToken,
  revokeSessionToken,
  verifySessionToken,
  verifySessionTokenSignature,
  type AdminSessionStore,
} from './admin-auth'

const originalEnv = { ...process.env }

function createMemoryStore(): AdminSessionStore {
  const sessions = new Map<string, Date>()

  return {
    async create({ id, expiresAt }) { sessions.set(id, expiresAt) },
    async exists(id, now) { return (sessions.get(id)?.getTime() ?? 0) > now.getTime() },
    async delete(id) { sessions.delete(id) },
    async deleteExpired(now) {
      for (const [id, expiresAt] of sessions) {
        if (expiresAt <= now) sessions.delete(id)
      }
    },
  }
}

describe('admin auth', () => {
  beforeEach(() => {
    process.env.ADMIN_USERNAME = 'mvp-admin'
    process.env.ADMIN_PASSWORD = 'local-password'
    process.env.ADMIN_SESSION_SECRET = 'local-session-secret-with-at-least-32-bytes'
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.useRealTimers()
  })

  it('accepts only the configured credentials', async () => {
    await expect(checkAdminCredentials('mvp-admin', 'local-password')).resolves.toBe(true)
    await expect(checkAdminCredentials('mvp-admin', 'wrong')).resolves.toBe(false)
  })

  it('invalidates an existing session after the password changes', async () => {
    const store = createMemoryStore()
    const token = await createSessionToken(store)
    await expect(verifySessionToken(token, store)).resolves.toBe(true)

    process.env.ADMIN_PASSWORD = 'changed-password'
    await expect(verifySessionToken(token, store)).resolves.toBe(false)
  })

  it('rejects tampered and expired tokens', async () => {
    const store = createMemoryStore()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-31T12:00:00.000Z'))
    const token = await createSessionToken(store)

    await expect(verifySessionToken(`${token}x`, store)).resolves.toBe(false)
    vi.advanceTimersByTime(25 * 60 * 60 * 1000)
    await expect(verifySessionToken(token, store)).resolves.toBe(false)
  })

  it('rejects the captured cookie immediately after logout revokes it', async () => {
    const store = createMemoryStore()
    const token = await createSessionToken(store)

    await expect(revokeSessionToken(token, store)).resolves.toBe(true)
    await expect(verifySessionToken(token, store)).resolves.toBe(false)
    await expect(verifySessionTokenSignature(token)).resolves.toBe(true)
  })

  it('rejects a weak session secret', async () => {
    process.env.ADMIN_SESSION_SECRET = 'too-short'
    await expect(createSessionToken(createMemoryStore())).rejects.toThrow('не менее 32 байт')
  })
})
