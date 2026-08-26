export interface RunCliFlags {
  noTui: boolean
  inputDir?: string
  batchSize?: number
  limit?: number
  resume?: boolean
  dryRun?: boolean
  skipMouser?: boolean
  skipLcsc?: boolean
  skipChipdip?: boolean
  mouserOnly?: boolean
  forceRefresh?: boolean
}

export function parseRunArgs(argv: string[]): RunCliFlags {
  const flags: RunCliFlags = { noTui: false }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    switch (arg) {
      case '--no-tui':
      case '--log-mode':
        flags.noTui = true
        break
      case '--input-dir':
        flags.inputDir = argv[++i]
        break
      case '--batch-size':
        flags.batchSize = Number(argv[++i])
        break
      case '--limit': {
        const value = Number(argv[++i])
        if (!Number.isInteger(value) || value < 1) {
          throw new CliUsageError('--limit requires a positive integer')
        }
        flags.limit = value
        break
      }
      case '--resume':
        flags.resume = true
        break
      case '--dry-run':
        flags.dryRun = true
        break
      case '--skip-mouser':
        flags.skipMouser = true
        break
      case '--skip-lcsc':
        flags.skipLcsc = true
        break
      case '--skip-chipdip':
        flags.skipChipdip = true
        break
      case '--mouser-only':
        flags.mouserOnly = true
        break
      case '--force-refresh':
        flags.forceRefresh = true
        break
    }
  }
  if (flags.mouserOnly && flags.skipMouser) {
    throw new CliUsageError('--mouser-only cannot be combined with --skip-mouser')
  }
  return flags
}

export interface PeriodRange {
  from: Date
  to: Date
}

export interface StatusCliFlags {
  watch: boolean
  brand: string | null
  unresolved: boolean
  json: boolean
  sourceStats: boolean
  period: PeriodRange | null
}

export class CliUsageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CliUsageError'
  }
}

function parsePeriod(input: string): PeriodRange {
  const parts = input.split('..')
  if (parts.length !== 2) {
    throw new CliUsageError('--period expects YYYY-MM-DD..YYYY-MM-DD')
  }
  const from = new Date(parts[0] + 'T00:00:00Z')
  const to = new Date(parts[1] + 'T23:59:59Z')
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new CliUsageError('--period dates must be valid ISO YYYY-MM-DD')
  }
  return { from, to }
}

export function parseStatusArgs(argv: string[]): StatusCliFlags {
  const flags: StatusCliFlags = {
    watch: false,
    brand: null,
    unresolved: false,
    json: false,
    sourceStats: false,
    period: null,
  }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    switch (arg) {
      case '--watch':
        flags.watch = true
        break
      case '--brand':
        flags.brand = argv[++i] ?? ''
        if (!flags.brand) throw new CliUsageError('--brand requires a name')
        break
      case '--unresolved':
        flags.unresolved = true
        break
      case '--json':
        flags.json = true
        break
      case '--source-stats':
        flags.sourceStats = true
        break
      case '--period':
        flags.period = parsePeriod(argv[++i] ?? '')
        break
    }
  }
  // Validate combinations
  if (flags.json && !flags.unresolved) {
    throw new CliUsageError('--json can only be used with --unresolved')
  }
  if (flags.unresolved && flags.sourceStats) {
    throw new CliUsageError('--unresolved and --source-stats are mutually exclusive')
  }
  if (flags.period && !flags.sourceStats) {
    throw new CliUsageError('--period can only be used with --source-stats')
  }
  return flags
}
