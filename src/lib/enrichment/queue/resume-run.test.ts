import { beforeEach, describe, expect, it, vi } from 'vitest'

const findFirst = vi.hoisted(() => vi.fn())

vi.mock('../../prisma', () => ({
  prisma: { importProgress: { findFirst } },
}))

import { loadResumableRun } from './resume-run'

describe('loadResumableRun', () => {
  beforeEach(() => {
    findFirst.mockReset()
  })

  it('selects only an unfinished running or paused run', async () => {
    const run = { id: 'run-1', totalProducts: 100, startedAt: new Date() }
    findFirst.mockResolvedValue(run)

    await expect(loadResumableRun()).resolves.toBe(run)
    expect(findFirst).toHaveBeenCalledWith({
      where: {
        status: { in: ['running', 'paused'] },
        completedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, totalProducts: true, startedAt: true },
    })
  })

  it('fails explicitly when there is nothing to resume', async () => {
    findFirst.mockResolvedValue(null)

    await expect(loadResumableRun()).rejects.toThrow('Нет незавершённого запуска')
  })
})
