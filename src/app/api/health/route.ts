import { NextResponse } from 'next/server'
import { checkApplicationHealth } from '@/lib/health'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(): Promise<NextResponse> {
  const result = await checkApplicationHealth(() => prisma.$queryRaw`SELECT 1`)

  return NextResponse.json(result.body, {
    status: result.statusCode,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}
