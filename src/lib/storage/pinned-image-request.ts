import type { LookupAddress } from 'node:dns'
import type { IncomingMessage } from 'node:http'
import { request, type RequestOptions } from 'node:https'
import type { LookupFunction } from 'node:net'

/** Internal transport: callers must validate the URL and every address first. */
export function requestPinnedImage(
  url: URL,
  addresses: LookupAddress[],
  signal: AbortSignal,
): Promise<IncomingMessage> {
  signal.throwIfAborted()
  if (!addresses.length) throw new Error('Image source has no verified addresses')
  const verified = addresses.map((address) => ({ ...address }))
  const pinnedLookup: LookupFunction = (_host, options, callback) => {
    if (options.all) callback(null, verified.map((address) => ({ ...address })))
    else callback(null, verified[0].address, verified[0].family)
  }
  return new Promise((resolve, reject) => {
    const options: RequestOptions & { autoSelectFamily: boolean } = {
      agent: false,
      lookup: pinnedLookup,
      autoSelectFamily: true,
      servername: url.hostname,
      rejectUnauthorized: true,
      signal,
      headers: {
        'User-Agent': 'electromagaz-enrichment/1.0',
        'Accept-Encoding': 'identity',
      },
    }
    const req = request(url, options, resolve)
    req.once('error', reject)
    req.end()
  })
}
