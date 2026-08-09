import { describe, expect, it } from 'vitest'
import { validateProductionConfig } from './production-config'

const runtimeEnvironment = {
  DATABASE_URL: 'postgresql://app:secret@db.example.com:5432/electromagaz',
  NEXT_PUBLIC_SITE_URL: 'https://electromagaz.ru',
  ADMIN_USERNAME: 'admin',
  ADMIN_PASSWORD: 'strong-admin-password',
  ADMIN_SESSION_SECRET: 'a-secure-session-secret-with-32-characters',
}

describe('production config validation', () => {
  it('accepts a complete core runtime configuration without deferred services', () => {
    expect(validateProductionConfig(runtimeEnvironment, 'runtime')).toEqual([])
  })

  it('rejects local URLs and weak admin credentials', () => {
    const issues = validateProductionConfig(
      {
        DATABASE_URL: 'postgresql://app:secret@localhost:5432/electromagaz',
        NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
        ADMIN_USERNAME: 'admin',
        ADMIN_PASSWORD: 'short',
        ADMIN_SESSION_SECRET: 'short',
      },
      'runtime',
    )

    expect(issues).toEqual(
      expect.arrayContaining([
        { name: 'DATABASE_URL', reason: 'указывает на локальный хост' },
        { name: 'NEXT_PUBLIC_SITE_URL', reason: 'ожидается протокол https:' },
        { name: 'ADMIN_PASSWORD', reason: 'короче 16 символов' },
        { name: 'ADMIN_SESSION_SECRET', reason: 'короче 32 символов' },
      ]),
    )
    expect(issues.map((issue) => issue.name)).not.toContain('R2_BUCKET')
  })

  it('never returns configuration values inside issues', () => {
    const sensitiveValue = 'do-not-print-this-value'
    const issues = validateProductionConfig({ DIRECT_URL: sensitiveValue }, 'migration')

    expect(JSON.stringify(issues)).not.toContain(sensitiveValue)
  })

  it('validates deferred integrations only when requested', () => {
    expect(validateProductionConfig({}, 'r2').map((issue) => issue.name)).toContain('R2_BUCKET')
    expect(validateProductionConfig({}, 'telegram')).toEqual([
      { name: 'TELEGRAM_BOT_TOKEN', reason: 'не задана' },
      { name: 'TELEGRAM_CHAT_ID', reason: 'не задана' },
    ])
  })
})
