import { SOURCE_PRIORITY, type DataSource, type ImageCandidate } from '../types'

const MAX_IMAGE_CANDIDATES = 10

export function normalizeImageCandidates(
  urls: string[],
  source: Exclude<DataSource, 'supplier-stub'>,
): ImageCandidate[] {
  const seen = new Set<string>()
  const candidates: ImageCandidate[] = []

  for (const raw of urls) {
    const url = normalizeHttpUrl(raw)
    if (!url || seen.has(url)) continue
    seen.add(url)
    candidates.push({ url, source })
    if (candidates.length === MAX_IMAGE_CANDIDATES) break
  }

  return candidates
}

export function canReplacePendingImageSource(
  current: DataSource | undefined,
  incoming: Exclude<DataSource, 'supplier-stub'>,
): boolean {
  return current === undefined || SOURCE_PRIORITY[incoming] >= SOURCE_PRIORITY[current]
}

function normalizeHttpUrl(value: string): string | null {
  try {
    const url = new URL(value.trim())
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    if (url.username || url.password) return null
    url.hash = ''
    return url.toString()
  } catch {
    return null
  }
}
