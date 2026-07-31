import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  checkAdminCredentials,
  createSessionToken,
  verifySessionToken,
} from './admin-auth'

const originalEnv = { ...process.env }

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
    const token = await createSessionToken()
    await expect(verifySessionToken(token)).resolves.toBe(true)

    process.env.ADMIN_PASSWORD = 'changed-password'
    await expect(verifySessionToken(token)).resolves.toBe(false)
  })

  it('rejects tampered and expired tokens', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-31T12:00:00.000Z'))
    const token = await createSessionToken()

    await expect(verifySessionToken(`${token}x`)).resolves.toBe(false)
    vi.advanceTimersByTime(8 * 24 * 60 * 60 * 1000)
    await expect(verifySessionToken(token)).resolves.toBe(false)
  })

  it('rejects a weak session secret', async () => {
    process.env.ADMIN_SESSION_SECRET = 'too-short'
    await expect(createSessionToken()).rejects.toThrow('не менее 32 байт')
  })
})
