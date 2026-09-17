import { beforeEach, describe, expect, it } from 'vitest'
import {
  loadRequestHistory,
  rememberRequest,
  REQUEST_HISTORY_KEY,
  requestStatusPath,
} from './request-history'

class MemoryStorage implements Storage {
  private values = new Map<string, string>()
  get length() { return this.values.size }
  clear() { this.values.clear() }
  getItem(key: string) { return this.values.get(key) ?? null }
  key(index: number) { return Array.from(this.values.keys())[index] ?? null }
  removeItem(key: string) { this.values.delete(key) }
  setItem(key: string, value: string) { this.values.set(key, value) }
}

const id = (character: string) => character.repeat(25)

describe('request history', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: new MemoryStorage() })
  })

  it('loads legacy quote entries and drops malformed data', () => {
    localStorage.setItem(REQUEST_HISTORY_KEY, JSON.stringify([
      { id: id('a'), createdAt: '2026-09-17T10:00:00.000Z' },
      { id: 'invalid', createdAt: '2026-09-17T10:00:00.000Z' },
      { id: id('b'), createdAt: 'invalid' },
      { id: id('d'), createdAt: '2026-09-17T10:00:00.000Z', kind: 'admin' },
    ]))

    expect(loadRequestHistory()).toEqual([
      { id: id('a'), createdAt: '2026-09-17T10:00:00.000Z', kind: 'quote' },
    ])
  })

  it('keeps quote and wholesale links distinct and deduplicates within each kind', () => {
    rememberRequest(id('c'), 'quote')
    rememberRequest(id('c'), 'wholesale')
    rememberRequest(id('c'), 'quote')

    const history = loadRequestHistory()
    expect(history).toHaveLength(2)
    expect(history.map(requestStatusPath)).toEqual([
      `/request-quote/status/${id('c')}`,
      `/wholesale/status/${id('c')}`,
    ])
  })

  it('keeps only the 20 most recent valid entries', () => {
    for (let index = 0; index < 25; index += 1) {
      rememberRequest(index.toString(36).padStart(25, '0'), 'wholesale')
    }
    const history = loadRequestHistory()
    expect(history).toHaveLength(20)
    expect(history[0].id).toBe((24).toString(36).padStart(25, '0'))
  })

  it('returns an empty history for damaged storage', () => {
    localStorage.setItem(REQUEST_HISTORY_KEY, '{broken')
    expect(loadRequestHistory()).toEqual([])
  })
})
