type PrismaEnvironment = Record<string, string | undefined>

export function applyPrismaEnvironmentFallbacks(environment: PrismaEnvironment): void {
  const databaseUrl = environment.POSTGRES_PRISMA_URL?.trim()
  if (!environment.DATABASE_URL && databaseUrl) {
    environment.DATABASE_URL = databaseUrl
  }

  const directUrl = environment.POSTGRES_URL_NON_POOLING?.trim()
  if (!environment.DIRECT_URL && directUrl) {
    environment.DIRECT_URL = directUrl
  }
}
