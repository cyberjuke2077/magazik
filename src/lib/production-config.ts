export type ProductionConfigScope = 'runtime' | 'migration' | 'publish' | 'r2' | 'telegram'

export interface ProductionConfigIssue {
  name: string
  reason: string
}

type Environment = Record<string, string | undefined>

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

function valueOf(environment: Environment, name: string): string | null {
  const value = environment[name]?.trim()
  return value ? value : null
}

function requireValue(
  environment: Environment,
  name: string,
  issues: ProductionConfigIssue[],
): string | null {
  const value = valueOf(environment, name)
  if (!value) issues.push({ name, reason: 'не задана' })
  return value
}

function requireMinimumLength(
  environment: Environment,
  name: string,
  minimum: number,
  issues: ProductionConfigIssue[],
): void {
  const value = requireValue(environment, name, issues)
  if (value && value.length < minimum) {
    issues.push({ name, reason: `короче ${minimum} символов` })
  }
}

function requireUrl(
  environment: Environment,
  name: string,
  protocols: string[],
  issues: ProductionConfigIssue[],
  options: { forbidLocal?: boolean } = {},
): void {
  const value = requireValue(environment, name, issues)
  if (!value) return

  try {
    const url = new URL(value)
    if (!protocols.includes(url.protocol)) {
      issues.push({ name, reason: `ожидается протокол ${protocols.join(' или ')}` })
    }
    if (!url.hostname) {
      issues.push({ name, reason: 'не содержит имя хоста' })
    }
    if (options.forbidLocal && LOCAL_HOSTS.has(url.hostname)) {
      issues.push({ name, reason: 'указывает на локальный хост' })
    }
  } catch {
    issues.push({ name, reason: 'содержит некорректный URL' })
  }
}

function validateR2(environment: Environment, issues: ProductionConfigIssue[]): void {
  requireUrl(environment, 'R2_ENDPOINT', ['https:'], issues, { forbidLocal: true })
  requireValue(environment, 'R2_ACCESS_KEY_ID', issues)
  requireValue(environment, 'R2_SECRET_ACCESS_KEY', issues)
  requireValue(environment, 'R2_BUCKET', issues)
  requireUrl(environment, 'R2_PUBLIC_URL', ['https:'], issues, { forbidLocal: true })
}

function validateTelegram(environment: Environment, issues: ProductionConfigIssue[]): void {
  requireValue(environment, 'TELEGRAM_BOT_TOKEN', issues)
  requireValue(environment, 'TELEGRAM_CHAT_ID', issues)
}

export function validateProductionConfig(
  environment: Environment,
  scope: ProductionConfigScope,
): ProductionConfigIssue[] {
  const issues: ProductionConfigIssue[] = []

  if (scope === 'runtime') {
    requireUrl(environment, 'DATABASE_URL', ['postgres:', 'postgresql:'], issues, {
      forbidLocal: true,
    })
    requireUrl(environment, 'NEXT_PUBLIC_SITE_URL', ['https:'], issues, { forbidLocal: true })
    requireValue(environment, 'ADMIN_USERNAME', issues)
    requireMinimumLength(environment, 'ADMIN_PASSWORD', 16, issues)
    requireMinimumLength(environment, 'ADMIN_SESSION_SECRET', 32, issues)
  } else if (scope === 'migration') {
    requireUrl(environment, 'DIRECT_URL', ['postgres:', 'postgresql:'], issues, {
      forbidLocal: true,
    })
  } else if (scope === 'publish') {
    requireUrl(environment, 'PUBLISH_DATABASE_URL', ['postgres:', 'postgresql:'], issues, {
      forbidLocal: true,
    })
  } else if (scope === 'r2') {
    validateR2(environment, issues)
  } else {
    validateTelegram(environment, issues)
  }

  return issues
}

export function isProductionConfigScope(value: string): value is ProductionConfigScope {
  return ['runtime', 'migration', 'publish', 'r2', 'telegram'].includes(value)
}
