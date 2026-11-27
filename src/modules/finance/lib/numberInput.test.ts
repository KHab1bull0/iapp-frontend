import { describe, expect, test } from 'vitest'
import { cleanNumber, grouped } from './numberInput'

describe('cleanNumber', () => {
  test("so'm is whole: every separator is grouping", () => {
    expect(cleanNumber('1.500.000', false)).toBe('1500000')
    expect(cleanNumber('1,500,000', false)).toBe('1500000')
    expect(cleanNumber('150 000', false)).toBe('150000')
    expect(cleanNumber('150,', false)).toBe('150')
    expect(cleanNumber('0', false)).toBe('')
    expect(cleanNumber('007', false)).toBe('7')
  })

  test('dollars: a "." or "," is the cents point, two digits after it', () => {
    expect(cleanNumber('12,5', true)).toBe('12.5')
    expect(cleanNumber('12.', true)).toBe('12.')
    expect(cleanNumber('.', true)).toBe('0.')
    expect(cleanNumber('12.505', true)).toBe('12.50')
    expect(cleanNumber('9.99', true)).toBe('9.99')
  })

  test('dollars pasted with grouping keep their value', () => {
    expect(cleanNumber('1,234.56', true)).toBe('1234.56')
    expect(cleanNumber('1.234,56', true)).toBe('1234.56')
    expect(cleanNumber('$1,500', true)).toBe('1500')
    expect(cleanNumber('1,500,000', true)).toBe('1500000')
    expect(cleanNumber('12 002.10', true)).toBe('12002.10')
  })

  test('at most `max` whole digits', () => {
    expect(cleanNumber('12345678901234', false, 10)).toBe('1234567890')
  })
})

describe('grouped', () => {
  test('groups the whole part, cents as typed', () => {
    expect(grouped('1234567')).toBe('1 234 567')
    expect(grouped('12002.1')).toBe('12 002.1')
    expect(grouped('12.')).toBe('12.')
  })
})
