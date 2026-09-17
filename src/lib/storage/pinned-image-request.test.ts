import { EventEmitter } from 'node:events'
import type { RequestOptions } from 'node:https'
import { afterEach, expect, it, vi } from 'vitest'
import { requestPinnedImage } from './pinned-image-request'

const { request } = vi.hoisted(() => ({ request: vi.fn() }))
vi.mock('node:https', () => ({ request }))
afterEach(() => vi.resetAllMocks())

it('uses only pinned answers for all connection attempts and preserves TLS verification', async () => {
  const req = Object.assign(new EventEmitter(), { end: vi.fn() })
  request.mockReturnValue(req)
  const addresses = [{ address: '93.184.216.34', family: 4 }, { address: '2606:4700::1111', family: 6 }]
  const pending = requestPinnedImage(new URL('https://assets.lcsc.com/image'), addresses, new AbortController().signal)
  const options = request.mock.calls[0][1] as RequestOptions
  expect(options).toMatchObject({ agent: false, servername: 'assets.lcsc.com', rejectUnauthorized: true })
  expect(options.checkServerIdentity).toBeUndefined()
  addresses[0].address = '127.0.0.1'
  const callback = vi.fn()
  options.lookup!('assets.lcsc.com', { all: true }, callback)
  expect(callback).toHaveBeenLastCalledWith(null, [
    { address: '93.184.216.34', family: 4 }, { address: '2606:4700::1111', family: 6 },
  ])
  options.lookup!('assets.lcsc.com', {}, callback)
  expect(callback).toHaveBeenLastCalledWith(null, '93.184.216.34', 4)
  req.emit('error', new Error('connection refused'))
  await expect(pending).rejects.toThrow('connection refused')
})

it('does not create a connection without a verified address', () => {
  expect(() => requestPinnedImage(new URL('https://assets.lcsc.com/image'), [], new AbortController().signal))
    .toThrow('no verified addresses')
  expect(request).not.toHaveBeenCalled()
})
