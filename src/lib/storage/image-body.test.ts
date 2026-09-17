import { IncomingMessage } from 'node:http'
import { Socket } from 'node:net'
import { brotliCompressSync, deflateSync, gzipSync } from 'node:zlib'
import { expect, it } from 'vitest'
import { MAX_IMAGE_BYTES, readImageBody } from './image-body'

function response(bytes: Buffer, encoding: string): IncomingMessage {
  const message = new IncomingMessage(new Socket())
  message.headers = { 'content-encoding': encoding }
  message.push(bytes)
  message.push(null)
  return message
}

it.each([
  ['gzip', gzipSync], ['deflate', deflateSync], ['br', brotliCompressSync],
] as const)('decodes %s with a bounded stream', async (encoding, compress) => {
  const bytes = Buffer.from('test image bytes')
  const message = response(compress(bytes), encoding)
  expect(await readImageBody(message, AbortSignal.timeout(1000))).toEqual(bytes)
  expect(message.destroyed).toBe(true)
})

it.each([
  ['gzip', gzipSync], ['deflate', deflateSync], ['br', brotliCompressSync],
] as const)('rejects a %s decompression bomb', async (encoding, compress) => {
  const message = response(compress(Buffer.alloc(MAX_IMAGE_BYTES + 1)), encoding)
  await expect(readImageBody(message, AbortSignal.timeout(2000))).rejects.toThrow('decoded limit')
  expect(message.destroyed).toBe(true)
})

it('rejects excessive wire bytes even if they decode to an empty image', async () => {
  // Gzip padding is ignored by the decoder, but must still count against ingress.
  const message = response(Buffer.concat([gzipSync(Buffer.alloc(0)), Buffer.alloc(MAX_IMAGE_BYTES)]), 'gzip')
  await expect(readImageBody(message, AbortSignal.timeout(1000))).rejects.toThrow('wire limit')
  expect(message.destroyed).toBe(true)
})

it('rejects truncated compression instead of returning a partial image', async () => {
  const message = response(gzipSync(Buffer.from('image')).subarray(0, 12), 'gzip')
  await expect(readImageBody(message, AbortSignal.timeout(1000))).rejects.toThrow()
  expect(message.destroyed).toBe(true)
})

it('propagates a transport error during decompression', async () => {
  const message = new IncomingMessage(new Socket())
  message.headers = { 'content-encoding': 'gzip' }
  message._read = () => message.destroy(new Error('connection lost'))
  await expect(readImageBody(message, AbortSignal.timeout(1000))).rejects.toThrow('connection lost')
})

it('aborts a compressed body that stalls after its first bytes', async () => {
  const message = new IncomingMessage(new Socket())
  message.headers = { 'content-encoding': 'gzip' }
  message._read = () => {}
  message.push(gzipSync(Buffer.from('image')).subarray(0, 10))
  await expect(readImageBody(message, AbortSignal.timeout(30))).rejects.toMatchObject({ name: 'AbortError' })
  expect(message.destroyed).toBe(true)
})
