import { describe, expect, it } from 'vitest'
import { isValidEmailAddress, mailtoHref } from './email-address'

describe('email addresses', () => {
  it('accepts a plus address and encodes it for mailto', () => {
    expect(isValidEmailAddress('buyer+project@example.ru')).toBe(true)
    expect(mailtoHref('buyer+project@example.ru')).toBe('mailto:buyer%2Bproject@example.ru')
  })

  it.each([
    'buyer@example.ru?bcc=copy@example.ru',
    'buyer@example.ru#fragment',
    'buyer@example.ru&bcc=copy@example.ru',
    'buyer example@example.ru',
    'buyer@localhost',
  ])('rejects unsafe or incomplete address %s', (address) => {
    expect(isValidEmailAddress(address)).toBe(false)
    expect(mailtoHref(address)).toBeNull()
  })
})
