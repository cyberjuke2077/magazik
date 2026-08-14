import { prisma } from '../../prisma'
import { type EnrichmentItemStatus, type PartIdentity } from '../types'

export interface StatusJournal {
  initJournal(runId: string, parts: PartIdentity[]): Promise<number>
  updateStatus(
    runId: string,
    brand: string,
    mpn: string,
    status: EnrichmentItemStatus,
    errorMessage?: string,
  ): Promise<void>
  incrementAttempts(
    runId: string,
    brand: string,
    mpn: string,
  ): Promise<number>
  getNextBatch(
    runId: string,
    status: EnrichmentItemStatus,
    limit: number,
  ): Promise<PartIdentity[]>
  getResumableItems(runId: string): Promise<number>
  requeueBlockedItems(runId: string, maxRetries?: number): Promise<number>
  skipPendingChipDip(runId: string, reason: string): Promise<number>
  getMouserQuotaToday(): Promise<number>
  getChipDipNotFound(runId: string, limit: number): Promise<PartIdentity[]>
  getLcscNotFound(runId: string, limit: number): Promise<PartIdentity[]>
  getStats(runId: string): Promise<Record<EnrichmentItemStatus, number>>
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10)
}

export function createStatusJournal(): StatusJournal {
  return {
    async initJournal(runId, parts) {
      const result = await prisma.enrichmentJournal.createMany({
        data: parts.map((p) => ({
          runId,
          canonicalBrand: p.canonicalBrand,
          canonicalMpn: p.canonicalMpn,
          originalMpn: p.originalMpn,
          status: 'pending',
        })),
        skipDuplicates: true,
      })
      return result.count
    },

    async updateStatus(runId, brand, mpn, status, errorMessage) {
      const mouserDay = status.startsWith('mouser_') ? todayUTC() : undefined

      await prisma.enrichmentJournal.update({
        where: {
          runId_canonicalBrand_canonicalMpn: {
            runId,
            canonicalBrand: brand,
            canonicalMpn: mpn,
          },
        },
        data: {
          status,
          errorMessage: errorMessage ?? null,
          attempts: { increment: 1 },
          ...(mouserDay ? { mouserDay } : {}),
        },
      })
    },

    async incrementAttempts(runId, brand, mpn) {
      const updated = await prisma.enrichmentJournal.update({
        where: {
          runId_canonicalBrand_canonicalMpn: {
            runId,
            canonicalBrand: brand,
            canonicalMpn: mpn,
          },
        },
        data: { attempts: { increment: 1 } },
        select: { attempts: true },
      })
      return updated.attempts
    },

    async getNextBatch(runId, status, limit) {
      const entries = await prisma.enrichmentJournal.findMany({
        where: { runId, status },
        take: limit,
      })
      return entries.map((e) => ({
        canonicalBrand: e.canonicalBrand,
        canonicalMpn: e.canonicalMpn,
        originalMpn: e.originalMpn,
        originalBrand: e.canonicalBrand,
        packages: [],
        dateCodes: [],
      }))
    },

    async getResumableItems(runId) {
      return prisma.enrichmentJournal.count({
        where: {
          runId,
          status: { notIn: ['done', 'unresolved'] },
        },
      })
    },

    /**
     * Resets `chipdip_blocked` items back to `pending` so the next ChipDip
     * pass can retry them. Items that exceeded `maxRetries` attempts are
     * promoted to `chipdip_not_found` instead — that way LCSC will pick
     * them up and we don't loop on a permanently banned MPN forever.
     *
     * Returns the count of items moved back to `pending`.
     */
    async requeueBlockedItems(runId, maxRetries = 5) {
      const exhausted = await prisma.enrichmentJournal.updateMany({
        where: { runId, status: 'chipdip_blocked', attempts: { gte: maxRetries } },
        data: { status: 'chipdip_not_found' },
      })

      const requeued = await prisma.enrichmentJournal.updateMany({
        where: { runId, status: 'chipdip_blocked', attempts: { lt: maxRetries } },
        data: { status: 'pending', errorMessage: null },
      })

      void exhausted
      return requeued.count
    },

    async skipPendingChipDip(runId, reason) {
      const updated = await prisma.enrichmentJournal.updateMany({
        where: { runId, status: 'pending' },
        data: { status: 'chipdip_not_found', errorMessage: reason },
      })
      return updated.count
    },

    async getMouserQuotaToday() {
      return prisma.enrichmentJournal.count({
        where: { mouserDay: todayUTC() },
      })
    },

    async getChipDipNotFound(runId, limit) {
      // LCSC accepts items where ChipDip failed for any reason — not found
      // OR blocked. Without including 'chipdip_blocked' here LCSC would
      // sit idle while ChipDip is on its 2-4h block-pause.
      const entries = await prisma.enrichmentJournal.findMany({
        where: { runId, status: { in: ['chipdip_not_found', 'chipdip_blocked'] } },
        take: limit,
      })
      return entries.map((e) => ({
        canonicalBrand: e.canonicalBrand,
        canonicalMpn: e.canonicalMpn,
        originalMpn: e.originalMpn,
        originalBrand: e.canonicalBrand,
        packages: [],
        dateCodes: [],
      }))
    },

    async getLcscNotFound(runId, limit) {
      const entries = await prisma.enrichmentJournal.findMany({
        where: { runId, status: 'lcsc_not_found' },
        take: limit,
      })
      return entries.map((e) => ({
        canonicalBrand: e.canonicalBrand,
        canonicalMpn: e.canonicalMpn,
        originalMpn: e.originalMpn,
        originalBrand: e.canonicalBrand,
        packages: [],
        dateCodes: [],
      }))
    },

    async getStats(runId) {
      const groups = await prisma.enrichmentJournal.groupBy({
        by: ['status'],
        where: { runId },
        _count: { status: true },
      })

      const allStatuses: EnrichmentItemStatus[] = [
        'pending',
        'chipdip_done',
        'chipdip_not_found',
        'chipdip_blocked',
        'lcsc_done',
        'lcsc_not_found',
        'lcsc_blocked',
        'mouser_queued',
        'mouser_done',
        'mouser_not_found',
        'mouser_failed',
        'mouser_brand_mismatch',
        'done',
        'unresolved',
      ]

      const stats = {} as Record<EnrichmentItemStatus, number>
      for (const s of allStatuses) {
        stats[s] = 0
      }
      for (const g of groups) {
        stats[g.status as EnrichmentItemStatus] = g._count.status
      }
      return stats
    },
  }
}
