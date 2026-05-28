/**
 * R2 connectivity smoke test. One-shot — checks that the configured
 * credentials can list/put/delete on the bucket. Run before backfill.
 */
import './_load-env'

import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'

const ENDPOINT = process.env.R2_ENDPOINT
const ACCESS = process.env.R2_ACCESS_KEY_ID
const SECRET = process.env.R2_SECRET_ACCESS_KEY
const BUCKET = process.env.R2_BUCKET

if (!ENDPOINT || !ACCESS || !SECRET || !BUCKET) {
  console.error('Missing R2 env vars:')
  console.error('  R2_ENDPOINT:          ', ENDPOINT ? '✓' : '✗')
  console.error('  R2_ACCESS_KEY_ID:     ', ACCESS ? '✓' : '✗')
  console.error('  R2_SECRET_ACCESS_KEY: ', SECRET ? '✓' : '✗')
  console.error('  R2_BUCKET:            ', BUCKET ? '✓' : '✗')
  process.exit(1)
}

console.log('Endpoint:', ENDPOINT)
console.log('Bucket:  ', BUCKET)
console.log('')

const client = new S3Client({
  region: 'auto',
  endpoint: ENDPOINT,
  credentials: { accessKeyId: ACCESS, secretAccessKey: SECRET },
})

async function main() {
  console.log('1/3 ListObjectsV2 (read)')
  const list = await client.send(new ListObjectsV2Command({ Bucket: BUCKET, MaxKeys: 5 }))
  console.log('    OK — KeyCount:', list.KeyCount ?? 0)

  console.log('2/3 PutObject (write)')
  const probeKey = '_probe/connectivity-test.txt'
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: probeKey,
      Body: Buffer.from(`probe ${new Date().toISOString()}`),
      ContentType: 'text/plain',
    }),
  )
  console.log('    OK — uploaded', probeKey)

  console.log('3/3 DeleteObject (cleanup)')
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: probeKey }))
  console.log('    OK')

  console.log('')
  console.log('R2 credentials work. Ready for backfill.')
}

main().catch((err: Error & { $metadata?: { httpStatusCode?: number } }) => {
  console.error('FAIL:', err.name, '-', err.message)
  if (err.$metadata?.httpStatusCode) {
    console.error('HTTP:', err.$metadata.httpStatusCode)
  }
  process.exit(1)
})
