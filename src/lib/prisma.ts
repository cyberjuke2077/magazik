import { PrismaClient } from '@prisma/client'
import { applyPrismaEnvironmentFallbacks } from './prisma-environment'

// Supabase's Vercel integration uses POSTGRES_* names. Keep the existing
// DATABASE_URL/DIRECT_URL contract for local development and other providers.
applyPrismaEnvironmentFallbacks(process.env)

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
