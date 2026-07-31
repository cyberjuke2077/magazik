import { spawn, type ChildProcess } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createServer } from 'node:net'
import { once } from 'node:events'
import { chromium, type Browser } from '@playwright/test'

const HOST = '127.0.0.1'
const BAD_DATABASE_URL = 'postgresql://invalid:invalid@127.0.0.1:6543/unavailable?schema=public'

async function freePort(): Promise<number> {
  const server = createServer()
  server.listen(0, HOST)
  await once(server, 'listening')
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Could not allocate a local port')
  const port = address.port
  server.close()
  await once(server, 'close')
  return port
}

async function waitForServer(url: string, process: ChildProcess): Promise<void> {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (process.exitCode !== null) throw new Error('Production server exited before it was ready')
    try {
      await fetch(url, { signal: AbortSignal.timeout(500) })
      return
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250))
    }
  }
  throw new Error('Production server did not become ready')
}

async function stopProcess(process: ChildProcess): Promise<void> {
  if (process.exitCode !== null) return
  process.kill('SIGTERM')
  await Promise.race([
    once(process, 'exit'),
    new Promise((resolve) => setTimeout(resolve, 5_000)),
  ])
  if (process.exitCode === null) process.kill('SIGKILL')
}

async function main(): Promise<void> {
  if (!existsSync('.next/BUILD_ID')) {
    throw new Error('Production build is missing. Run npm run build:local first.')
  }

  const port = await freePort()
  const baseUrl = `http://${HOST}:${port}`
  const nextBin = require.resolve('next/dist/bin/next')
  const server = spawn(process.execPath, [nextBin, 'start', '-H', HOST, '-p', String(port)], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DATABASE_URL: BAD_DATABASE_URL,
      DIRECT_URL: BAD_DATABASE_URL,
    },
    stdio: 'ignore',
    windowsHide: true,
  })

  let browser: Browser | null = null
  try {
    await waitForServer(baseUrl, server)
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()
    await page.goto(`${baseUrl}/catalog?q=DB-FAILURE-${Date.now()}`, {
      waitUntil: 'networkidle',
    })

    const body = await page.locator('body').innerText()
    const genericError =
      body.includes('Ошибка загрузки каталога') ||
      body.includes('Не удалось загрузить страницу')
    const internalLeak =
      body.includes('127.0.0.1:6543') ||
      body.includes('PrismaClient') ||
      body.includes('P1001') ||
      body.includes('DATABASE_URL')

    console.log(
      `Unavailable DB browser check: genericError=${genericError} internalLeak=${internalLeak}`,
    )
    if (!genericError || internalLeak) {
      throw new Error('Unavailable database UI did not meet the safety contract')
    }
  } finally {
    if (browser) await browser.close()
    await stopProcess(server)
  }
}

main().catch((error: unknown) => {
  console.error(
    'Unavailable DB check failed:',
    error instanceof Error ? error.message : 'Unknown error',
  )
  process.exitCode = 1
})
