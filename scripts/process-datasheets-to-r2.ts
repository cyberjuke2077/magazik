import './_load-env'
import { prisma } from '../src/lib/prisma'
import { isR2Configured, isR2PublicUrlConfigured } from '../src/lib/storage/r2-client'
import { runDatasheetWorker } from '../src/lib/enrichment/datasheets/datasheet-worker'

interface CliArgs {
  limit: number
  dryRun: boolean
}

function parseArgs(argv: string[]): CliArgs {
  const result: CliArgs = { limit: 100, dryRun: false }
  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index]
    if (argument === '--dry-run') result.dryRun = true
    else if (argument === '--limit') {
      const limit = Number.parseInt(argv[++index] ?? '', 10)
      if (!Number.isInteger(limit) || limit < 1 || limit > 10_000) {
        throw new Error('--limit должен быть целым числом от 1 до 10000')
      }
      result.limit = limit
    } else if (argument === '--help' || argument === '-h') {
      console.log('Использование: npm run datasheets:process -- [--limit N] [--dry-run]')
      process.exit(0)
    } else throw new Error(`Неизвестный аргумент: ${argument}`)
  }
  return result
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  if (!isR2Configured()) {
    throw new Error('Не настроен R2. Заполните R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY и R2_BUCKET.')
  }
  if (!isR2PublicUrlConfigured()) {
    throw new Error('Не задан R2_PUBLIC_URL. Без публичного адреса ссылки нельзя сохранять в БД.')
  }

  console.log('ДАТАШИТЫ - ПРОВЕРКА И ЗАГРУЗКА В CLOUDFLARE R2')
  console.log(`Режим: ${args.dryRun ? 'только показать очередь' : 'загрузка'}`)
  console.log(`Лимит товаров: ${args.limit}\n`)
  const summary = await runDatasheetWorker(args)
  console.log('\nИТОГ')
  console.log(`Выбрано товаров: ${summary.selected}`)
  console.log(`Завершено: ${summary.completed}`)
  console.log(`С ошибкой: ${summary.failed}`)
  console.log(`PDF сохранено: ${summary.uploaded}`)
  if (summary.failed > 0) process.exitCode = 1
}

main()
  .catch((error: unknown) => {
    console.error(`\nОшибка: ${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 1
  })
  .finally(async () => prisma.$disconnect())
