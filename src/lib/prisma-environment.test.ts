import { describe, expect, it } from 'vitest'

import { applyPrismaEnvironmentFallbacks } from './prisma-environment'

describe('applyPrismaEnvironmentFallbacks', () => {
  it('uses Vercel Supabase integration variables when Prisma names are absent', () => {
    const environment: Record<string, string | undefined> = {
      POSTGRES_PRISMA_URL: 'postgresql://runtime.example.com/database',
      POSTGRES_URL_NON_POOLING: 'postgresql://migration.example.com/database',
    }

    applyPrismaEnvironmentFallbacks(environment)

    expect(environment.DATABASE_URL).toBe(environment.POSTGRES_PRISMA_URL)
    expect(environment.DIRECT_URL).toBe(environment.POSTGRES_URL_NON_POOLING)
  })

  it('does not replace explicitly configured Prisma URLs', () => {
    const environment = {
      DATABASE_URL: 'postgresql://explicit.example.com/database',
      DIRECT_URL: 'postgresql://direct.example.com/database',
      POSTGRES_PRISMA_URL: 'postgresql://fallback.example.com/database',
      POSTGRES_URL_NON_POOLING: 'postgresql://fallback-direct.example.com/database',
    }

    applyPrismaEnvironmentFallbacks(environment)

    expect(environment.DATABASE_URL).toBe('postgresql://explicit.example.com/database')
    expect(environment.DIRECT_URL).toBe('postgresql://direct.example.com/database')
  })

  it('leaves Prisma names absent when no fallback exists', () => {
    const environment: Record<string, string | undefined> = {}

    applyPrismaEnvironmentFallbacks(environment)

    expect(environment).not.toHaveProperty('DATABASE_URL')
    expect(environment).not.toHaveProperty('DIRECT_URL')
  })
})
