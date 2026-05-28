/**
 * Loads `.env.local` ahead of `.env` so secrets in .env.local override
 * the committed .env defaults. Idempotent — safe to call multiple times.
 *
 * Why not `dotenv/config`: it only loads `.env`. Next.js handles
 * `.env.local` automatically at runtime, but our standalone tsx scripts
 * (backfill, smoke tests, enrichment) need this manual loader.
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const FILES = ['.env.local', '.env']

let loaded = false

export function loadEnv(cwd: string = process.cwd()): void {
  if (loaded) return
  loaded = true
  for (const file of FILES) {
    const path = resolve(cwd, file)
    if (!existsSync(path)) continue
    const text = readFileSync(path, 'utf8')
    for (const rawLine of text.split('\n')) {
      const line = rawLine.trim()
      if (!line || line.startsWith('#')) continue
      const eq = line.indexOf('=')
      if (eq === -1) continue
      const key = line.slice(0, eq).trim()
      let value = line.slice(eq + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      if (process.env[key] === undefined) process.env[key] = value
    }
  }
}

loadEnv()
