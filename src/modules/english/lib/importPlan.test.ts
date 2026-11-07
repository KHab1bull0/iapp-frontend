import { describe, expect, test } from 'vitest'
import { tag } from '@/modules/english/test-data'
import type { ParsedRow } from './excel'
import { classify } from './importPlan'

const row = (line: number, word: string, extra: Partial<ParsedRow['row']> = {}, problems: ParsedRow['problems'] = []): ParsedRow => ({
  line,
  row: { word, translation: `${word}-uz`, ...extra },
  problems,
})

describe('classify', () => {
  test('adds new words once, skips ones already there, leaves out bad rows, lists new tags', () => {
    const plan = classify(
      [
        row(2, 'deadline', { tags: ['work', 'noun'] }),
        row(3, 'Apple'),
        row(4, 'Deadline'),
        row(5, 'luggage', { tags: ['Travel'] }),
        row(6, 'passport', { tags: ['travel', 'Noun'] }),
        row(7, 'oops', {}, ['missingTranslation']),
        row(8, 'salary', { tags: ['t1'] }),
      ],
      ['apple'],
      [tag('t1', 'Work'), tag('t2', 'noun')],
    )
    expect(plan.statuses).toEqual(['new', 'exists', 'repeated', 'new', 'new', 'invalid', 'new'])
    expect(plan.counts).toEqual({ new: 4, exists: 1, repeated: 1, invalid: 1 })
    expect(plan.toAdd.map((r) => r.word)).toEqual(['deadline', 'luggage', 'passport', 'salary'])
    expect(plan.newTags).toEqual(['Travel'])
  })
})
