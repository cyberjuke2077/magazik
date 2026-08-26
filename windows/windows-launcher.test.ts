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

  it('offers offline validation, pilots, full run, resume and status', () => {
    const menu = read('windows/parser-menu.ps1')

    expect(menu).toContain("@('--dry-run', '--no-tui')")
    expect(menu).toContain("@('--limit', '1', '--force-refresh')")
    expect(menu).toContain("@('--limit', '5', '--force-refresh')")
    expect(menu).toContain("@('--limit', '100')")
    expect(menu).toContain("@('--resume')")
    expect(menu).toContain("$confirmation -ceq 'RUN ALL'")
    expect(menu).toContain('enrichment:status:local')
  })

  it('keeps Windows awake and preserves the safe stop exit code', () => {
    const menu = read('windows/parser-menu.ps1')

    expect(menu).toContain('SetThreadExecutionState')
    expect(menu).toContain('Set-ParserAwake $true')
    expect(menu).toContain('$parserExit -eq 130')
  })

  it('uses cross-platform local database npm commands', () => {
    const pkg = JSON.parse(read('package.json')) as {
      scripts: Record<string, string>
    }

    expect(pkg.scripts['enrichment:run']).toContain('enrichment-run.mts')
    expect(pkg.scripts['enrichment:run:local']).toContain('with-local-db.ts')
    expect(pkg.scripts['enrichment:status:local']).toContain('with-local-db.ts')
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
  })

  it('keeps PowerShell launchers ASCII-safe for Windows PowerShell 5.1', () => {
    expect(read('windows/install-parser.ps1')).toMatch(/^[\x00-\x7F]*$/)
    expect(read('windows/parser-menu.ps1')).toMatch(/^[\x00-\x7F]*$/)
  })
})
