import { describe, expect, it } from 'vitest'
import {
  diffOrphans,
  parsePosixProcessOutput,
  parseWindowsProcessOutput,
} from '../integration/helpers/process-snapshot'

describe('process snapshot parsers', () => {
  it('parses POSIX ps output', () => {
    expect(parsePosixProcessOutput('  42 /usr/bin/chromium --headless\n100 node app.js\n')).toEqual([
      { pid: 42, command: '/usr/bin/chromium --headless' },
      { pid: 100, command: 'node app.js' },
    ])
  })

  it('parses one Windows process object', () => {
    expect(
      parseWindowsProcessOutput(
        '{"ProcessId":42,"Name":"chrome.exe","CommandLine":"chrome.exe --headless"}',
      ),
    ).toEqual([{ pid: 42, command: 'chrome.exe chrome.exe --headless' }])
  })

  it('parses multiple Windows process objects and ignores invalid rows', () => {
    expect(
      parseWindowsProcessOutput(
        '[{"ProcessId":42,"Name":"chrome.exe","CommandLine":null},{"Name":"invalid"}]',
      ),
    ).toEqual([{ pid: 42, command: 'chrome.exe' }])
  })
})

describe('diffOrphans', () => {
  it('returns only pids created after the initial snapshot', () => {
    expect(diffOrphans([10, 20], [10, 20, 30])).toEqual([30])
  })
})
