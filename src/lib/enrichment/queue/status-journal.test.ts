import { beforeEach, describe, expect, it, vi } from 'vitest'

const prismaMocks = vi.hoisted(() => ({
  updateMany: vi.fn(),
  findMany: vi.fn(),
}))

vi.mock('../../prisma', () => ({
  prisma: {
    enrichmentJournal: {
      updateMany: prismaMocks.updateMany,
      findMany: prismaMocks.findMany,
    },
  },
}))

import { createStatusJournal } from './status-journal'

describe('source fallback routing', () => {
  beforeEach(() => {
    prismaMocks.updateMany.mockReset()
    prismaMocks.findMany.mockReset()
  })

  it('moves pending entries past a skipped ChipDip stage', async () => {
    prismaMocks.updateMany.mockResolvedValue({ count: 3 })

    const count = await createStatusJournal().skipPendingChipDip(
      'run-1',
      'ChipDip skipped',
    )

    expect(count).toBe(3)
    expect(prismaMocks.updateMany).toHaveBeenCalledWith({
      where: { runId: 'run-1', status: 'pending' },
      data: {
        status: 'chipdip_not_found',
        errorMessage: 'ChipDip skipped',
      },
    })
  })

  it('moves all ChipDip misses past a skipped LCSC stage', async () => {
    prismaMocks.updateMany.mockResolvedValue({ count: 2 })

    await createStatusJournal().routePendingLcsc(
      'run-1',
      'lcsc_not_found',
      'LCSC skipped',
    )

    expect(prismaMocks.updateMany).toHaveBeenCalledWith({
      where: {
        runId: 'run-1',
        status: { in: ['chipdip_not_found', 'chipdip_blocked'] },
      },
      data: {
        status: 'lcsc_not_found',
        errorMessage: 'LCSC skipped',
      },
    })
  })

  it('lets Mouser consume LCSC misses and blocked entries', async () => {
    prismaMocks.findMany.mockResolvedValue([])

    await createStatusJournal().getLcscNotFound('run-1', 100)

    expect(prismaMocks.findMany).toHaveBeenCalledWith({
      where: {
        runId: 'run-1',
        status: { in: ['lcsc_not_found', 'lcsc_blocked'] },
      },
      take: 100,
    })
  })
})
