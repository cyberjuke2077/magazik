import type { Browser } from 'playwright-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { closeAllBrowsers, registerBrowser, unregisterBrowser } from './browser-registry'

interface MockBrowserOptions {
  closeDelay?: number
  closeFails?: boolean
  closeNeverResolves?: boolean
  noProcess?: boolean
}

interface MockBrowser {
  close: ReturnType<typeof vi.fn>
  process: ReturnType<typeof vi.fn>
  _killSpy: ReturnType<typeof vi.fn>
}

function createMockBrowser(opts: MockBrowserOptions = {}): MockBrowser {
  const killSpy = vi.fn()

  const closeImpl = (): Promise<void> => {
    if (opts.closeFails) return Promise.reject(new Error('boom'))
    if (opts.closeNeverResolves) return new Promise<void>(() => {})
    if (opts.closeDelay !== undefined) {
      return new Promise((resolve) => setTimeout(resolve, opts.closeDelay))
    }
    return Promise.resolve()
  }

  const processImpl = opts.noProcess
    ? vi.fn().mockReturnValue(null)
    : vi.fn().mockReturnValue({ kill: killSpy, pid: 12345 })

  return {
    close: vi.fn(closeImpl),
    process: processImpl,
    _killSpy: killSpy,
  }
}

function asBrowser(mock: MockBrowser): Browser {
  return mock as unknown as Browser
}

describe('browser-registry', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(async () => {
    // Защитная зачистка: если тест зарегистрировал браузер и не закрыл — убираем.
    await closeAllBrowsers(50)
    warnSpy.mockRestore()
    vi.useRealTimers()
  })

  describe('closeAllBrowsers', () => {
    it('closes fast browsers within timeout without SIGKILL', async () => {
      const a = createMockBrowser()
      const b = createMockBrowser()
      registerBrowser(asBrowser(a))
      registerBrowser(asBrowser(b))

      await closeAllBrowsers(1000)

      expect(a.close).toHaveBeenCalledTimes(1)
      expect(b.close).toHaveBeenCalledTimes(1)
      expect(a._killSpy).not.toHaveBeenCalled()
      expect(b._killSpy).not.toHaveBeenCalled()
    })

    it('SIGKILLs hanging browser after timeout', async () => {
      const hanging = createMockBrowser({ closeNeverResolves: true })
      registerBrowser(asBrowser(hanging))

      await closeAllBrowsers(100)

      expect(hanging.close).toHaveBeenCalledTimes(1)
      expect(hanging._killSpy).toHaveBeenCalledTimes(1)
      expect(hanging._killSpy).toHaveBeenCalledWith('SIGKILL')
    })

    it('is idempotent: second call does nothing and does not throw', async () => {
      const a = createMockBrowser()
      registerBrowser(asBrowser(a))

      await closeAllBrowsers(500)
      // Второй вызов — реестр уже пуст, исключений быть не должно.
      await expect(closeAllBrowsers(500)).resolves.toBeUndefined()

      expect(a.close).toHaveBeenCalledTimes(1)
    })

    it('warns but does not throw when hanging browser has no pid', async () => {
      const hanging = createMockBrowser({ closeNeverResolves: true, noProcess: true })
      registerBrowser(asBrowser(hanging))

      await expect(closeAllBrowsers(100)).resolves.toBeUndefined()

      expect(hanging._killSpy).not.toHaveBeenCalled()
      const warnedAboutPid = warnSpy.mock.calls.some((args) =>
        args.some((arg) => typeof arg === 'string' && arg.includes('could not SIGKILL: no pid')),
      )
      expect(warnedAboutPid).toBe(true)
    })

    it('logs browser.close() rejection via console.warn but does not throw', async () => {
      const failing = createMockBrowser({ closeFails: true })
      registerBrowser(asBrowser(failing))

      await expect(closeAllBrowsers(500)).resolves.toBeUndefined()

      expect(failing.close).toHaveBeenCalledTimes(1)
      // Реджект трактуется как «закрылся», SIGKILL не нужен.
      expect(failing._killSpy).not.toHaveBeenCalled()
      const warnedAboutClose = warnSpy.mock.calls.some((args) =>
        args.some((arg) => typeof arg === 'string' && arg.includes('browser.close() failed')),
      )
      expect(warnedAboutClose).toBe(true)
    })
  })

  describe('registerBrowser / unregisterBrowser', () => {
    it('unregistered browser is not closed by closeAllBrowsers', async () => {
      const a = createMockBrowser()
      registerBrowser(asBrowser(a))
      unregisterBrowser(asBrowser(a))

      await closeAllBrowsers(500)

      expect(a.close).not.toHaveBeenCalled()
    })
  })
})
