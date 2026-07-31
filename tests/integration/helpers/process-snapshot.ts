import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const CHROMIUM_PATTERN = /chrome|chromium|cloakbrowser/i

interface ProcessInfo {
  pid: number
  command: string
}

/**
 * Кроссплатформенный снимок Chromium/CloakBrowser процессов.
 *
 * На Windows читаем Win32_Process через PowerShell, на macOS/Linux используем
 * стандартный `ps`. Фильтрация выполняется в Node, поэтому не зависит от pgrep.
 */
export async function snapshotChromiumPids(): Promise<number[]> {
  const processes = await listProcesses()
  return processes
    .filter((processInfo) => CHROMIUM_PATTERN.test(processInfo.command))
    .map((processInfo) => processInfo.pid)
}

export async function describeProcessPids(pids: number[]): Promise<string> {
  if (pids.length === 0) return '(none)'

  const expected = new Set(pids)
  const matches = (await listProcesses()).filter((processInfo) => expected.has(processInfo.pid))

  if (matches.length === 0) return '(processes already exited)'
  return matches.map((processInfo) => `${processInfo.pid} ${processInfo.command}`).join('\n')
}

/**
 * Возвращает pid, которых не было в `before`, но появились в `after`.
 */
export function diffOrphans(before: number[], after: number[]): number[] {
  const beforeSet = new Set(before)
  return after.filter((pid) => !beforeSet.has(pid))
}

async function listProcesses(): Promise<ProcessInfo[]> {
  if (process.platform === 'win32') {
    const command = [
      'Get-CimInstance Win32_Process',
      'Select-Object ProcessId,Name,CommandLine',
      'ConvertTo-Json -Compress',
    ].join(' | ')
    const { stdout } = await execFileAsync(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', command],
      { maxBuffer: 10 * 1024 * 1024, windowsHide: true },
    )
    return parseWindowsProcessOutput(stdout)
  }

  const { stdout } = await execFileAsync('ps', ['-axo', 'pid=,command='], {
    maxBuffer: 10 * 1024 * 1024,
  })
  return parsePosixProcessOutput(stdout)
}

export function parsePosixProcessOutput(stdout: string): ProcessInfo[] {
  const processes: ProcessInfo[] = []

  for (const line of stdout.split(/\r?\n/)) {
    const match = /^\s*(\d+)\s+(.+)$/.exec(line)
    if (!match) continue

    const pid = Number.parseInt(match[1], 10)
    if (Number.isFinite(pid) && pid > 0) {
      processes.push({ pid, command: match[2] })
    }
  }

  return processes
}

export function parseWindowsProcessOutput(stdout: string): ProcessInfo[] {
  const trimmed = stdout.trim()
  if (!trimmed) return []

  const parsed: unknown = JSON.parse(trimmed)
  const rows = Array.isArray(parsed) ? parsed : [parsed]

  return rows.flatMap((row) => {
    if (!isRecord(row)) return []

    const pid = Number(row.ProcessId)
    if (!Number.isFinite(pid) || pid <= 0) return []

    const name = typeof row.Name === 'string' ? row.Name : ''
    const commandLine = typeof row.CommandLine === 'string' ? row.CommandLine : ''
    return [{ pid, command: `${name} ${commandLine}`.trim() }]
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
