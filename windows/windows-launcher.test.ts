import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))

function read(relativePath: string): string {
  return readFileSync(resolve(root, relativePath), 'utf8')
}

describe('Windows parser launcher', () => {
  it('installs dependencies, starts PostgreSQL and applies migrations', () => {
    const installer = read('windows/install-parser.ps1')

    expect(installer).toContain("'OpenJS.NodeJS.LTS'")
    expect(installer).toContain("'Docker.DockerDesktop'")
    expect(installer).toContain('& npm.cmd ci')
    expect(installer).toContain('& docker compose up -d postgres')
    expect(installer).toContain('& npm.cmd run db:migrate:local')
  })

  it('offers dry-run, controlled batches, resume and status', () => {
    const menu = read('windows/parser-menu.ps1')

    expect(menu).toContain("@('--dry-run', '--no-tui')")
    expect(menu).toContain("@('--limit', '1', '--force-refresh')")
    expect(menu).toContain("@('--limit', '5', '--force-refresh')")
    expect(menu).toContain("@('--limit', '100')")
    expect(menu).toContain("@('--resume')")
    expect(menu).toContain('enrichment:status:local')
    expect(menu).toContain('$LASTEXITCODE -eq 130')
  })

  it('does not embed database or R2 credentials', () => {
    const scripts = [
      read('windows/install-parser.ps1'),
      read('windows/parser-menu.ps1'),
      read('windows/INSTALL.cmd'),
      read('windows/RUN-PARSER.cmd'),
    ].join('\n')

    expect(scripts).not.toMatch(/R2_SECRET_ACCESS_KEY\s*=/)
    expect(scripts).not.toMatch(/DATABASE_URL\s*=/)
    expect(scripts.toLowerCase()).not.toContain('browseract')
  })
})
