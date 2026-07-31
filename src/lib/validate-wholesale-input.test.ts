import { describe, expect, it } from 'vitest'
import { validateWholesaleInput } from './validate-wholesale-input'

const validInput = {
  name: 'Иван Петров',
  company: 'ООО Ромашка',
  phone: '+7 900 123-45-67',
  email: 'buyer@example.ru',
  message: 'Нужен расчёт партии компонентов',
  consent: true,
}

describe('validateWholesaleInput', () => {
  it('accepts valid input with personal data consent', () => {
    expect(validateWholesaleInput(validInput)).toEqual({ valid: true })
  })

  it('rejects input without personal data consent', () => {
    const result = validateWholesaleInput({ ...validInput, consent: false })

    expect(result.valid).toBe(false)
    expect(result.error).toBe('Необходимо согласие на обработку персональных данных')
  })

  it('rejects malformed email after consent validation', () => {
    const result = validateWholesaleInput({ ...validInput, email: 'invalid-email' })

    expect(result.valid).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('rejects a non-string required field received at runtime', () => {
    const malformed = {
      ...validInput,
      name: { unexpected: true },
    } as unknown as Parameters<typeof validateWholesaleInput>[0]

    expect(validateWholesaleInput(malformed).valid).toBe(false)
  })
})
