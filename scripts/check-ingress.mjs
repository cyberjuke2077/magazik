import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Real nginx + a local echo upstream. No host ports, credentials, or production traffic.
const image = 'nginx:1.28-alpine@sha256:a8b39bd9cf0f83869a2162827a0caf6137ddf759d50a171451b335cecc87d236'
const name = `electromagaz-ingress-test-${process.pid}`
const directory = mkdtempSync(join(tmpdir(), 'emg-ingress-'))
const docker = (args) => execFileSync('docker', args, { encoding: 'utf8', timeout: 30_000, stdio: ['ignore', 'pipe', 'pipe'] })
let started = false
try {
  const proxy = readFileSync(new URL('../deploy/nginx/electromagaz-proxy.conf', import.meta.url), 'utf8')
  writeFileSync(join(directory, 'nginx.conf'), `events {}\nhttp {
    access_log off;
    server { listen 8080; location / { ${proxy} } }
    server { listen 127.0.0.1:3000; location / {
      default_type application/json;
      return 200 '{"ip":"$http_x_forwarded_for","real":"$http_x_real_ip","vercel":"$http_x_vercel_forwarded_for","forwarded":"$http_forwarded","host":"$http_host","forwardedHost":"$http_x_forwarded_host","proto":"$http_x_forwarded_proto"}';
    } }
  }`)
  docker(['run', '--rm', '-d', '--name', name, '-v', `${directory}/nginx.conf:/etc/nginx/nginx.conf:ro`, image])
  started = true
  docker(['exec', name, 'nginx', '-t'])
  for (const forged of ['198.51.100.10', '203.0.113.20, 198.51.100.10']) {
    const headers = ['X-Forwarded-For', 'X-Real-IP', 'X-Vercel-Forwarded-For', 'Forwarded', 'X-Forwarded-Host', 'X-Forwarded-Proto']
    const output = docker(['exec', name, 'wget', '-qO-', ...headers.flatMap((header) => ['--header', `${header}: ${forged}`]), 'http://127.0.0.1:8080/'])
    assert.deepEqual(JSON.parse(output), { ip: '127.0.0.1', real: '127.0.0.1', vercel: '', forwarded: '', host: '127.0.0.1', forwardedHost: '127.0.0.1', proto: 'http' })
  }
  const ports = JSON.parse(docker(['inspect', '--format', '{{json .HostConfig.PortBindings}}', name]))
  assert.equal(Object.keys(ports ?? {}).length, 0)
  console.log('Ingress passed: spoofed headers replaced, upstream private, no host ports published')
} finally {
  if (started) docker(['stop', '--time', '1', name])
  rmSync(directory, { recursive: true, force: true })
}
