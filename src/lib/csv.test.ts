import { expect, it } from 'vitest'
import { escapeCsvField } from './csv'

it.each(['=1+1', '+1', '-1', '@SUM(A1)', '  =1', '\t=1'])('neutralizes %j', (input) => {
  expect(escapeCsvField(input)).toBe(`'${input}`)
})
it('quotes CR, quotes and separators without changing ordinary part numbers', () => {
  expect(escapeCsvField('STM32-F1')).toBe('STM32-F1')
  expect(escapeCsvField('a\rb')).toBe('"a\rb"')
  expect(escapeCsvField('a,"b"')).toBe('"a,""b"""')
})
