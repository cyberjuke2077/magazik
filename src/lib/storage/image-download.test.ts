import { afterEach, expect, it, vi } from 'vitest'
import { IncomingMessage } from 'node:http'
import { Socket } from 'node:net'
import { fetchImageBytes, MAX_IMAGE_BYTES } from './image-download'

const { dnsLookup, request } = vi.hoisted(() => ({
  dnsLookup: vi.fn<() => Promise<Array<{ address: string; family: number }>>>(),
  request: vi.fn(),
}))
vi.mock('node:dns/promises', () => ({ lookup: dnsLookup }))
vi.mock('./pinned-image-request', () => ({ requestPinnedImage: request }))
afterEach(() => { vi.resetAllMocks() })
const publicAddress = { address: '93.184.216.34', family: 4 }
function publicDns() { dnsLookup.mockResolvedValue([publicAddress]) }

function response(chunks: Buffer[], status = 200, headers = {}): IncomingMessage {
  const message = new IncomingMessage(new Socket())
  message.statusCode = status
  message.headers = headers
  for (const chunk of chunks) message.push(chunk)
  message.push(null)
  return message
}

it('cancels an oversized stream without downloading its remainder', async () => {
  publicDns()
  const message = new IncomingMessage(new Socket())
  message.statusCode = 200
  let bytesRequested = 0
  message._read = () => { bytesRequested += 1024; message.push(Buffer.alloc(1024)) }
  request.mockResolvedValue(message)
  await expect(fetchImageBytes('https://assets.lcsc.com/test')).rejects.toThrow('8 MiB')
  expect(message.destroyed).toBe(true)
  expect(bytesRequested).toBeLessThan(MAX_IMAGE_BYTES + 128 * 1024)
})

it.each([
  ['127.0.0.1', 4], ['10.0.0.1', 4], ['169.254.169.254', 4], ['::1', 6],
  ['fc00::1', 6], ['fe80::1', 6], ['ff02::1', 6], ['::ffff:7f00:1', 6],
])('does not connect to blocked address %s', async (address, family) => {
  dnsLookup.mockResolvedValue([{ address, family }])
  await expect(fetchImageBytes('https://assets.lcsc.com/test')).rejects.toThrow('non-public')
  expect(request).not.toHaveBeenCalled()
})

it('rejects mixed public and private DNS answers', async () => {
  dnsLookup.mockResolvedValue([publicAddress, { address: '127.0.0.1', family: 4 }])
  await expect(fetchImageBytes('https://assets.lcsc.com/test')).rejects.toThrow('non-public')
  expect(request).not.toHaveBeenCalled()
})

it('pins the validated address without resolving it a second time', async () => {
  dnsLookup.mockResolvedValueOnce([publicAddress]).mockResolvedValue([{ address: '127.0.0.1', family: 4 }])
  request.mockResolvedValue(response([Buffer.from('image')]))
  expect(await fetchImageBytes('https://assets.lcsc.com/test')).toEqual(Buffer.from('image'))
  expect(dnsLookup).toHaveBeenCalledTimes(1)
  expect(request).toHaveBeenCalledWith(new URL('https://assets.lcsc.com/test'), [publicAddress], expect.any(AbortSignal))
})

it('rejects a same-host redirect when its DNS answer becomes private', async () => {
  dnsLookup.mockResolvedValueOnce([publicAddress]).mockResolvedValue([{ address: '127.0.0.1', family: 4 }])
  const redirect = response([], 302, { location: '/next' })
  request.mockResolvedValue(redirect)
  await expect(fetchImageBytes('https://assets.lcsc.com/test')).rejects.toThrow('non-public')
  expect(dnsLookup).toHaveBeenCalledTimes(2)
  expect(request).toHaveBeenCalledTimes(1)
  expect(redirect.destroyed).toBe(true)
})

it('validates and pins every allowed redirect target', async () => {
  const second = { address: '2606:4700::1111', family: 6 }
  dnsLookup.mockResolvedValueOnce([publicAddress]).mockResolvedValueOnce([second])
  request.mockResolvedValueOnce(response([], 302, { location: 'https://www.mouser.com/image' }))
    .mockResolvedValueOnce(response([Buffer.from('image')]))
  expect(await fetchImageBytes('https://assets.lcsc.com/test')).toEqual(Buffer.from('image'))
  expect(request.mock.calls[1].slice(0, 2)).toEqual([new URL('https://www.mouser.com/image'), [second]])
})

it('does not follow a redirect to an untrusted host', async () => {
  publicDns()
  request.mockResolvedValue(response([], 302, { location: 'http://127.0.0.1/private' }))
  await expect(fetchImageBytes('https://assets.lcsc.com/test')).rejects.toThrow('Untrusted')
  expect(request).toHaveBeenCalledOnce()
})

it('stops after three redirects', async () => {
  publicDns()
  request.mockImplementation(async () => response([], 302, { location: '/again' }))
  await expect(fetchImageBytes('https://assets.lcsc.com/test')).rejects.toThrow('Too many')
  expect(request).toHaveBeenCalledTimes(4)
})

it('rejects an oversized declared body before reading', async () => {
  publicDns()
  const message = response([], 200, { 'content-length': String(MAX_IMAGE_BYTES + 1) })
  request.mockResolvedValue(message)
  await expect(fetchImageBytes('https://assets.lcsc.com/test')).rejects.toThrow('8 MiB')
  expect(message.destroyed).toBe(true)
})

it('fails explicitly if the source ignores identity encoding', async () => {
  publicDns()
  const message = response([], 200, { 'content-encoding': 'gzip' })
  request.mockResolvedValue(message)
  await expect(fetchImageBytes('https://assets.lcsc.com/test')).rejects.toThrow('encoding')
  expect(message.destroyed).toBe(true)
})

it('honors an already cancelled caller before DNS or fetch', async () => {
  const controller = new AbortController()
  controller.abort()
  await expect(fetchImageBytes('https://assets.lcsc.com/test', {signal:controller.signal})).rejects.toThrow()
  expect(dnsLookup).not.toHaveBeenCalled()
  expect(request).not.toHaveBeenCalled()
})

it('honors cancellation while DNS is still pending', async () => {
  dnsLookup.mockReturnValue(new Promise(() => {}))
  const controller = new AbortController()
  const pending = fetchImageBytes('https://assets.lcsc.com/test', { signal: controller.signal })
  controller.abort(new Error('cancel DNS'))
  await expect(pending).rejects.toThrow('cancel DNS')
  expect(request).not.toHaveBeenCalled()
})
