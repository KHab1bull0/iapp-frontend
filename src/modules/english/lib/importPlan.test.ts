import { describe, expect, test } from 'vitest'
import { category } from '@/modules/english/test-data'
import type { ParsedRow } from './excel'
import { classify } from './importPlan'

const row = (line: number, word: string, extra: Partial<ParsedRow['row']> = {}, problems: ParsedRow['problems'] = []): ParsedRow => ({
  line,
  row: { word, translation: `${word}-uz`, ...extra },
  problems,
})

describe('classify', () => {
  test('adds new words once, skips ones already there, leaves out bad rows, lists new categories', () => {
    const plan = classify(
      [
        row(2, 'deadline', { category: 'work' }),
        row(3, 'Apple'),
        row(4, 'Deadline'),
        row(5, 'luggage', { category: 'Travel' }),
        row(6, 'passport', { category: 'travel' }),
        row(7, 'oops', {}, ['missingTranslation']),
        row(8, 'salary', { category: 'c1' }),
      ],
      ['apple'],
      [category('c1', 'Work')],
    )
    expect(plan.statuses).toEqual(['new', 'exists', 'repeated', 'new', 'new', 'invalid', 'new'])
    expect(plan.counts).toEqual({ new: 4, exists: 1, repeated: 1, invalid: 1 })
    expect(plan.toAdd.map((r) => r.word)).toEqual(['deadline', 'luggage', 'passport', 'salary'])
    expect(plan.newCategories).toEqual(['Travel'])
  })
})
