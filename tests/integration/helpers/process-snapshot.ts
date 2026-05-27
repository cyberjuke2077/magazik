import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

/**
 * Снимок pid'ов всех живых процессов в системе, которые относятся к Chromium/CloakBrowser.
 *
 * Использует `pgrep -lf 'chrome|chromium|cloakbrowser'`. Регулярка совпадает с командной
 * строкой процесса (-f), вывод включает pid и имя команды (-l). Чувствительность к регистру
 * у `pgrep` зависит от платформы; на macOS/Linux дефолт — case-sensitive, что нас устраивает,
 * потому что реальные command line содержат именно эти строки в нижнем регистре.
 *
 * Возвращает пустой массив, если совпадений нет (pgrep в этом случае выходит с кодом 1).
 */
export async function snapshotChromiumPids(): Promise<number[]> {
  try {
    const { stdout } = await execAsync("pgrep -lf 'chrome|chromium|cloakbrowser'")
    return parsePgrepOutput(stdout)
  } catch (err) {
    // pgrep exit code 1 — нет совпадений, это валидный пустой результат
    const code = (err as { code?: number }).code
    if (code === 1) return []
    throw err
  }
}

/**
 * Возвращает pid'ы, которых не было в `before`, но появились в `after` — т.е. orphan'ы,
 * рождённые в течение теста и не убитые к моменту проверки.
 */
export function diffOrphans(before: number[], after: number[]): number[] {
  const beforeSet = new Set(before)
  return after.filter((pid) => !beforeSet.has(pid))
}

function parsePgrepOutput(stdout: string): number[] {
  return stdout
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => Number.parseInt(line.split(/\s+/)[0] ?? '', 10))
    .filter((pid) => Number.isFinite(pid) && pid > 0)
}
