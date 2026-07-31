import { prisma } from '../src/lib/prisma'

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is required')

  const host = new URL(databaseUrl).hostname
  if (host !== '127.0.0.1' && host !== 'localhost' && host !== '[::1]') {
    throw new Error(`Refusing to inspect a non-local database host: ${host}`)
  }

  const [products, datasheets, testRequests, testLeads, rateLimitCounters] = await Promise.all([
    prisma.product.count({ where: { tags: { has: 'local-mvp' } } }),
    prisma.datasheet.count({ where: { product: { tags: { has: 'local-mvp' } } } }),
    prisma.quoteRequest.count({ where: { email: { endsWith: '@local.test' } } }),
    prisma.wholesaleLead.count({ where: { email: { endsWith: '@local.test' } } }),
    prisma.submissionRateLimit.count(),
  ])

  if (products !== 3) {
    throw new Error(`Expected 3 local MVP products, found ${products}`)
  }
  if (datasheets !== 2) {
    throw new Error(`Expected 2 verified local MVP datasheets, found ${datasheets}`)
  }
  if (testRequests !== 0) {
    throw new Error(`Expected E2E cleanup to leave 0 test requests, found ${testRequests}`)
  }
  if (testLeads !== 0) {
    throw new Error(`Expected E2E cleanup to leave 0 test leads, found ${testLeads}`)
  }
  if (rateLimitCounters !== 0) {
    throw new Error(`Expected E2E cleanup to leave 0 rate-limit counters, found ${rateLimitCounters}`)
  }

  console.log('Local MVP database check passed: 3 products, 2 datasheets, 0 leftover requests, leads or rate-limit counters')
}

main()
  .catch((error: unknown) => {
    console.error('Local MVP database check failed:', error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
