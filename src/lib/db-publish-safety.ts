export interface ProtectedProductionCounts {
  QuoteRequest: number
  QuoteRequestItem: number
  WholesaleLead: number
}

function databaseIdentity(value: string): string {
  let url: URL

  try {
    url = new URL(value)
  } catch {
    throw new Error('Строка подключения к БД имеет неверный формат')
  }

  const database = decodeURIComponent(url.pathname.replace(/^\/+/, ''))
  if (!url.hostname || !database) {
    throw new Error('В строке подключения должны быть указаны host и database')
  }

  return `${url.hostname.toLowerCase()}:${url.port || '5432'}/${database}`
}

export function assertSafePublishUrls(sourceUrl: string, targetUrl: string): void {
  if (/pgbouncer=true|:6543\//i.test(targetUrl)) {
    throw new Error(
      'PUBLISH_DATABASE_URL должен указывать на session-порт 5432 без pgbouncer',
    )
  }

  if (databaseIdentity(sourceUrl) === databaseIdentity(targetUrl)) {
    throw new Error('DATABASE_URL и PUBLISH_DATABASE_URL не должны указывать на одну БД')
  }
}

export function protectedCountsMatch(
  before: ProtectedProductionCounts,
  after: ProtectedProductionCounts,
): boolean {
  return (Object.keys(before) as (keyof ProtectedProductionCounts)[]).every(
    (key) => before[key] === after[key],
  )
}
