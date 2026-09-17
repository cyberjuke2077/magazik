import { afterEach, expect, it, vi } from 'vitest'
import { lookup } from 'node:dns/promises'
import { fetchImageBytes, MAX_IMAGE_BYTES } from './image-download'

const { dnsLookup } = vi.hoisted(() => ({ dnsLookup: vi.fn<() => Promise<Array<{ address: string; family: number }>>>() }))
vi.mock('node:dns/promises', () => ({ lookup: dnsLookup }))
afterEach(() => { vi.unstubAllGlobals(); vi.resetAllMocks() })
function publicDns() { dnsLookup.mockResolvedValue([{address:'93.184.216.34',family:4}]) }

it('cancels an oversized stream without downloading its remainder', async () => {
  publicDns()
  const cancel = vi.fn()
  let reads = 0
  const body = new ReadableStream({ pull(controller) {
    reads++
    controller.enqueue(new Uint8Array(MAX_IMAGE_BYTES))
  }, cancel }, { highWaterMark: 0 })
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body)))
  await expect(fetchImageBytes('https://assets.lcsc.com/test')).rejects.toThrow('8 MiB')
  expect(cancel).toHaveBeenCalledOnce()
  expect(reads).toBe(2)
})
it('does not fetch a private address or redirect to an untrusted host', async () => {
  dnsLookup.mockResolvedValue([{address:'127.0.0.1',family:4}])
  const request = vi.fn()
  vi.stubGlobal('fetch', request)
  await expect(fetchImageBytes('https://assets.lcsc.com/test')).rejects.toThrow('non-public')
  expect(request).not.toHaveBeenCalled()
  publicDns()
  request.mockResolvedValue(new Response(null, {status:302,headers:{location:'http://127.0.0.1/private'}}))
  await expect(fetchImageBytes('https://assets.lcsc.com/test')).rejects.toThrow('Untrusted')
  expect(request).toHaveBeenCalledOnce()
})
it('honors an already cancelled caller before DNS or fetch', async () => {
  const controller = new AbortController()
  controller.abort()
  await expect(fetchImageBytes('https://assets.lcsc.com/test', {signal:controller.signal})).rejects.toThrow()
  expect(lookup).not.toHaveBeenCalled()
})
