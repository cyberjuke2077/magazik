import { lookup } from 'node:dns/promises'
import { BlockList, isIP } from 'node:net'

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024
const blocked = new BlockList()
for (const [address, prefix] of [['0.0.0.0',8], ['10.0.0.0',8], ['100.64.0.0',10],
  ['127.0.0.0',8], ['169.254.0.0',16], ['172.16.0.0',12], ['192.168.0.0',16],
  ['192.0.0.0',24], ['198.18.0.0',15], ['224.0.0.0',4], ['240.0.0.0',4]] as const) {
  blocked.addSubnet(address, prefix, 'ipv4')
}
blocked.addAddress('::', 'ipv6')
blocked.addAddress('::1', 'ipv6')
blocked.addSubnet('fc00::', 7, 'ipv6')
blocked.addSubnet('fe80::', 10, 'ipv6')

export async function assertImageSource(url: URL): Promise<void> {
  const host = url.hostname.toLowerCase()
  const r2Host = process.env.R2_PUBLIC_URL ? new URL(process.env.R2_PUBLIC_URL).hostname : null
  const trusted = host === 'static.chipdip.ru' || host === 'www.chipdip.ru' || host === r2Host ||
    ['lcsc.com', 'mouser.com'].some((domain) => host === domain || host.endsWith(`.${domain}`))
  if (url.protocol !== 'https:' || url.username || url.password || url.port && url.port !== '443' || !trusted) {
    throw new Error('Untrusted image source')
  }
  const addresses = await lookup(host, { all: true, verbatim: true })
  if (!addresses.length || addresses.some(({address}) => {
    const normalized = address.replace(/^::ffff:/i, '')
    const family = isIP(normalized)
    return !family || blocked.check(normalized, family === 4 ? 'ipv4' : 'ipv6')
  })) throw new Error('Image source resolves to a non-public address')
}

async function readBoundedBody(response: Response): Promise<Buffer> {
  const declaredSize = Number(response.headers.get('content-length'))
  if (declaredSize > MAX_IMAGE_BYTES) {
    await response.body?.cancel()
    throw new Error('Image exceeds 8 MiB limit')
  }
  if (!response.body) throw new Error('Image response has no body')
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  try {
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > MAX_IMAGE_BYTES) {
        await reader.cancel()
        throw new Error('Image exceeds 8 MiB limit')
      }
      chunks.push(value)
    }
    return Buffer.concat(chunks, total)
  } finally {
    reader.releaseLock()
  }
}

export async function fetchImageBytes(source: string, options: { signal?: AbortSignal; timeoutMs?: number } = {}): Promise<Buffer> {
  const signal = AbortSignal.any([AbortSignal.timeout(options.timeoutMs ?? 20_000), ...(options.signal ? [options.signal] : [])])
  let url = new URL(source)
  for (let redirects = 0; redirects <= 3; redirects++) {
    signal.throwIfAborted()
    await assertImageSource(url)
    signal.throwIfAborted()
    const response = await fetch(url, { signal, redirect: 'manual', headers: { 'User-Agent': 'electromagaz-enrichment/1.0' } })
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      await response.body?.cancel()
      const location = response.headers.get('location')
      if (!location) throw new Error('Image redirect has no location')
      url = new URL(location, url)
      continue
    }
    if (!response.ok) {
      await response.body?.cancel()
      throw new Error(`Image download failed: HTTP ${response.status}`)
    }
    return readBoundedBody(response)
  }
  throw new Error('Too many image redirects')
}
