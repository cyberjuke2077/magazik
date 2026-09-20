import { lookup } from 'node:dns/promises'
import type { LookupAddress } from 'node:dns'
import { BlockList, isIP } from 'node:net'
import { requestPinnedImage } from './pinned-image-request'
import { readImageBody } from './image-body'

export { MAX_IMAGE_BYTES } from './image-body'
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
blocked.addSubnet('ff00::', 8, 'ipv6')

async function resolveImageSource(url: URL, signal: AbortSignal): Promise<LookupAddress[]> {
  const host = url.hostname.toLowerCase()
  const r2Host = process.env.R2_PUBLIC_URL ? new URL(process.env.R2_PUBLIC_URL).hostname : null
  const trusted = host === 'static.chipdip.ru' || host === 'www.chipdip.ru' || host === r2Host ||
    ['lcsc.com', 'mouser.com'].some((domain) => host === domain || host.endsWith(`.${domain}`))
  if (url.protocol !== 'https:' || url.username || url.password || url.port && url.port !== '443' || !trusted) {
    throw new Error('Untrusted image source')
  }
  const addresses = await lookupWithSignal(host, signal)
  if (!addresses.length || addresses.some(({address}) => {
    const family = isIP(address)
    return !family || blocked.check(address, family === 4 ? 'ipv4' : 'ipv6')
  })) throw new Error('Image source resolves to a non-public address')
  return addresses
}

function lookupWithSignal(host: string, signal: AbortSignal): Promise<LookupAddress[]> {
  signal.throwIfAborted()
  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason)
    signal.addEventListener('abort', abort, { once: true })
    lookup(host, { all: true, verbatim: true }).then(resolve, reject)
      .finally(() => signal.removeEventListener('abort', abort))
  })
}

export async function fetchImageBytes(source: string, options: { signal?: AbortSignal; timeoutMs?: number } = {}): Promise<Buffer> {
  const signal = AbortSignal.any([AbortSignal.timeout(options.timeoutMs ?? 20_000), ...(options.signal ? [options.signal] : [])])
  let url = new URL(source)
  for (let redirects = 0; redirects <= 3; redirects++) {
    signal.throwIfAborted()
    const addresses = await resolveImageSource(url, signal)
    signal.throwIfAborted()
    const response = await requestPinnedImage(url, addresses, signal)
    const status = response.statusCode ?? 0
    if ([301, 302, 303, 307, 308].includes(status)) {
      response.destroy()
      const location = response.headers.location
      if (!location) throw new Error('Image redirect has no location')
      url = new URL(location, url)
      continue
    }
    if (status < 200 || status >= 300) {
      response.destroy()
      throw new Error(`Image download failed: HTTP ${status}`)
    }
    return readImageBody(response, signal)
  }
  throw new Error('Too many image redirects')
}
