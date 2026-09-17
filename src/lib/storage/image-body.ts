import type { IncomingMessage } from 'node:http'
import { PassThrough, Transform, Writable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { createBrotliDecompress, createGunzip, createInflate } from 'node:zlib'

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024

function decoder(encoding: string | undefined): Transform {
  switch (encoding?.trim().toLowerCase()) {
    case undefined: case 'identity': return new PassThrough()
    case 'gzip': return createGunzip()
    case 'deflate': return createInflate()
    case 'br': return createBrotliDecompress()
    default: throw new Error('Unsupported image content encoding')
  }
}

function wireLimit(): Transform {
  let total = 0
  return new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      total += chunk.byteLength
      callback(total > MAX_IMAGE_BYTES ? new Error('Image exceeds 8 MiB wire limit') : null, chunk)
    },
  })
}

export async function readImageBody(response: IncomingMessage, signal: AbortSignal): Promise<Buffer> {
  const chunks: Buffer[] = []
  let total = 0
  try {
    if (Number(response.headers['content-length']) > MAX_IMAGE_BYTES) {
      throw new Error('Image exceeds 8 MiB wire limit')
    }
    const decode = decoder(response.headers['content-encoding'])
    const collect = new Writable({
      write(chunk: Buffer, _encoding, callback) {
        total += chunk.byteLength
        if (total > MAX_IMAGE_BYTES) return callback(new Error('Image exceeds 8 MiB decoded limit'))
        chunks.push(chunk)
        callback()
      },
    })
    await pipeline(response, wireLimit(), decode, collect, { signal })
    return Buffer.concat(chunks, total)
  } finally {
    response.destroy()
  }
}
