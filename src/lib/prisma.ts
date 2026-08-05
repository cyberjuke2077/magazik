import { PrismaClient } from '@prisma/client'

// Supabase's Vercel integration uses POSTGRES_* names. Keep the existing
// DATABASE_URL/DIRECT_URL contract for local development and other providers.
process.env.DATABASE_URL ??= process.env.POSTGRES_PRISMA_URL
process.env.DIRECT_URL ??= process.env.POSTGRES_URL_NON_POOLING

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
