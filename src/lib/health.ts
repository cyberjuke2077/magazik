export interface HealthResult {
  statusCode: 200 | 503
  body: {
    status: 'ok' | 'unavailable'
    database: 'ok' | 'unavailable'
  }
}

export async function checkApplicationHealth(
  checkDatabase: () => Promise<unknown>,
  timeoutMs: number = 3_000,
): Promise<HealthResult> {
  let timeout: ReturnType<typeof setTimeout> | undefined

  try {
    await Promise.race([
      checkDatabase(),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error('Health check timed out')), timeoutMs)
      }),
    ])

    return {
      statusCode: 200,
      body: { status: 'ok', database: 'ok' },
    }
  } catch {
    return {
      statusCode: 503,
      body: { status: 'unavailable', database: 'unavailable' },
    }
  } finally {
    if (timeout) clearTimeout(timeout)
  }
}
