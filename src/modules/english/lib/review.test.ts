import { describe, expect, test } from 'vitest'
import { reviewLabel } from './review'
import { englishMessages } from '@/modules/english/i18n'

const en = englishMessages.en

describe('reviewLabel', () => {
  test('relative to today', () => {
    expect(reviewLabel('2026-10-31', '2026-10-31', en)).toBe('Due today')
    expect(reviewLabel('2026-10-29', '2026-10-31', en)).toBe('Due 2 days ago')
    expect(reviewLabel('2026-11-01', '2026-10-31', en)).toBe('Tomorrow')
    expect(reviewLabel('2026-11-07', '2026-10-31', en)).toBe('In 7 days')
  })
})

test('reviewLabel in Uzbek', () => {
  const uz = englishMessages.uz
  expect(reviewLabel('2026-10-31', '2026-10-31', uz)).toBe('Bugun')
  expect(reviewLabel('2026-11-07', '2026-10-31', uz)).toBe('7 kundan keyin')
})
