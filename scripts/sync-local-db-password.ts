import 'dotenv/config'
import { spawn } from 'node:child_process'

function requiredEnv(name: 'POSTGRES_USER' | 'POSTGRES_PASSWORD' | 'POSTGRES_DB'): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required to synchronize the local database`)
  return value
}

function quoteIdentifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`
}

function quoteLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`
}

const user = requiredEnv('POSTGRES_USER')
const password = requiredEnv('POSTGRES_PASSWORD')
const database = requiredEnv('POSTGRES_DB')

const child = spawn(
  'docker',
  [
    'exec',
    '-i',
    'electromagaz_db',
    'psql',
    '-U',
    user,
    '-d',
    database,
    '--set',
    'ON_ERROR_STOP=1',
    '--quiet',
  ],
  { stdio: ['pipe', 'inherit', 'inherit'], shell: false },
)

// The password travels only through stdin and is never placed in the process
// command line or printed to the terminal.
child.stdin.end(`ALTER ROLE ${quoteIdentifier(user)} WITH PASSWORD ${quoteLiteral(password)};\n`)

child.on('error', (error) => {
  console.error('Failed to start Docker:', error.message)
  process.exitCode = 1
})

child.on('exit', (code) => {
  if (code === 0) console.log('Local PostgreSQL password now matches .env')
  process.exitCode = code ?? 1
})
