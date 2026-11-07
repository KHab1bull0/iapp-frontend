import { afterEach, describe, expect, test } from 'vitest'
import { frontSide, loadDirection, saveDirection } from './direction'

describe('review direction', () => {
  afterEach(() => localStorage.removeItem('iapp-review-direction'))

  test('English first unless chosen otherwise, and the choice is remembered', () => {
    expect(loadDirection()).toBe('en-uz')
    saveDirection('uz-en')
    expect(loadDirection()).toBe('uz-en')
    localStorage.setItem('iapp-review-direction', 'sideways')
    expect(loadDirection()).toBe('en-uz')
  })

  test('a fixed direction always shows its side; a mix keeps each word on one side, and uses both', () => {
    expect(frontSide('en-uz', 'abc')).toBe('en')
    expect(frontSide('uz-en', 'abc')).toBe('uz')
    const ids = Array.from({ length: 20 }, (_, i) => `word-${i}`)
    const sides = ids.map((id) => frontSide('mixed', id))
    expect(ids.map((id) => frontSide('mixed', id))).toEqual(sides)
    expect(new Set(sides)).toEqual(new Set(['en', 'uz']))
  })
})
