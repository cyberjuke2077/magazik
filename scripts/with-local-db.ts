import 'dotenv/config'
import { spawn } from 'node:child_process'

function requiredEnv(name: 'POSTGRES_USER' | 'POSTGRES_PASSWORD' | 'POSTGRES_DB'): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required for local database commands`)
  return value
}

function localDatabaseUrl(): string {
  const user = encodeURIComponent(requiredEnv('POSTGRES_USER'))
  const password = encodeURIComponent(requiredEnv('POSTGRES_PASSWORD'))
  const database = encodeURIComponent(requiredEnv('POSTGRES_DB'))
  const port = Number(process.env.POSTGRES_PORT ?? '5432')
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid local POSTGRES_PORT')
  return `postgresql://${user}:${password}@127.0.0.1:${port}/${database}?schema=public`
}

const [command, ...args] = process.argv.slice(2)
if (!command) throw new Error('A command is required')
const npmExecPath = process.env.npm_execpath
const resolvedCommand = command === 'npm' && npmExecPath ? process.execPath : command
const resolvedArgs = command === 'npm' && npmExecPath ? [npmExecPath, ...args] : args

const databaseUrl = localDatabaseUrl()
const child = spawn(resolvedCommand, resolvedArgs, {
  stdio: 'inherit',
  shell: false,
  env: {
    ...process.env,
    DATABASE_URL: databaseUrl,
    DIRECT_URL: databaseUrl,
    ...(args.includes('test:e2e') ? { E2E_LOCAL_MVP: '1' } : {}),
  },
})

child.on('error', (error) => {
  console.error(`Failed to start ${command}:`, error.message)
  process.exitCode = 1
})

child.on('exit', (code, signal) => {
  if (signal) {
    console.error(`${command} exited from signal ${signal}`)
    process.exitCode = 1
    return
  }
  process.exitCode = code ?? 1
})
