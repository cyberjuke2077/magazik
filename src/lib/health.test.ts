import { describe, expect, it, vi } from 'vitest'
import { checkApplicationHealth } from './health'

describe('application health', () => {
  it('reports a healthy database without internal details', async () => {
    const result = await checkApplicationHealth(vi.fn().mockResolvedValue([{ ok: 1 }]))

    expect(result).toEqual({
      statusCode: 200,
      body: { status: 'ok', database: 'ok' },
    })
  })

  it('returns a neutral unavailable response when the database fails', async () => {
    const result = await checkApplicationHealth(
      vi.fn().mockRejectedValue(new Error('postgresql://secret@internal-db:5432/prod')),
    )

    expect(result).toEqual({
      statusCode: 503,
      body: { status: 'unavailable', database: 'unavailable' },
    })
    expect(JSON.stringify(result)).not.toContain('internal-db')
  })

  it('times out without exposing the rejected operation', async () => {
    vi.useFakeTimers()
    try {
      const pending = checkApplicationHealth(() => new Promise(() => undefined), 10)
      await vi.advanceTimersByTimeAsync(10)

      await expect(pending).resolves.toEqual({
        statusCode: 503,
        body: { status: 'unavailable', database: 'unavailable' },
      })
    } finally {
      vi.useRealTimers()
    }
  })
})
