import { SOURCE_PRIORITY, type DataSource, type DatasheetCandidate } from '../types'

const MAX_DATASHEET_CANDIDATES = 5

export function normalizeDatasheetCandidates(
  urls: string[],
  source: DataSource,
  mpn: string,
): DatasheetCandidate[] {
  const seen = new Set<string>()
  const candidates: DatasheetCandidate[] = []

  for (const raw of urls) {
    const url = normalizeHttpsUrl(raw)
    if (!url || seen.has(url)) continue
    seen.add(url)
    candidates.push({
      url,
      source,
      title: `${mpn} Datasheet`,
      language: source === 'chipdip' ? 'ru' : 'en',
    })
    if (candidates.length === MAX_DATASHEET_CANDIDATES) break
  }

  return candidates
}

export function canReplacePendingDatasheetSource(
  current: DataSource | undefined,
  incoming: DataSource,
): boolean {
  return current === undefined || SOURCE_PRIORITY[incoming] >= SOURCE_PRIORITY[current]
}

export function isManagedDatasheetUrl(value: string, publicBase: string): boolean {
  const normalizedBase = publicBase.replace(/\/+$/, '')
  return value.startsWith(`${normalizedBase}/datasheets/`)
}

function normalizeHttpsUrl(value: string): string | null {
  try {
    const url = new URL(value.trim())
    if (url.protocol !== 'https:' || url.username || url.password) return null
    url.hash = ''
    return url.toString()
  } catch {
    return null
  }
}
