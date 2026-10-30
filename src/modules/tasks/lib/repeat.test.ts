import { describe, expect, test } from 'vitest'
import type { Task } from '@/modules/tasks/api/tasks'
import { describeRepeat, dueLabel, groupByDue } from './repeat'

const TODAY = '2026-10-30' // a Friday

const task = (over: Partial<Task>): Task => ({
  id: over.id ?? 'id',
  title: 'T',
  note: null,
  dueDate: null,
  dueTime: null,
  repeatMode: 'none',
  repeatUnit: null,
  repeatEvery: null,
  repeatWeekdays: null,
  completedAt: null,
  createdAt: '',
  updatedAt: '',
  ...over,
})

describe('describeRepeat', () => {
  test('one-off tasks have no label', () => {
    expect(describeRepeat(task({}))).toBe('')
  })

  test('schedule in days, weeks and months', () => {
    expect(describeRepeat(task({ repeatMode: 'schedule', repeatUnit: 'day', repeatEvery: 1 }))).toBe('Every day')
    expect(describeRepeat(task({ repeatMode: 'schedule', repeatUnit: 'day', repeatEvery: 3 }))).toBe('Every 3 days')
    expect(
      describeRepeat(task({ repeatMode: 'schedule', repeatUnit: 'week', repeatEvery: 1, repeatWeekdays: [1, 3, 5] })),
    ).toBe('Mon · Wed · Fri')
    expect(
      describeRepeat(task({ repeatMode: 'schedule', repeatUnit: 'week', repeatEvery: 2, repeatWeekdays: [0] })),
    ).toBe('Every 2 weeks: Sun')
    expect(
      describeRepeat(task({ repeatMode: 'schedule', repeatUnit: 'month', repeatEvery: 1, dueDate: '2026-11-15' })),
    ).toBe('Every month on the 15th')
    expect(
      describeRepeat(task({ repeatMode: 'schedule', repeatUnit: 'month', repeatEvery: 3, dueDate: '2026-11-01' })),
    ).toBe('Every 3 months on the 1st')
  })

  test('after done', () => {
    expect(describeRepeat(task({ repeatMode: 'after_done', repeatUnit: 'day', repeatEvery: 10 }))).toBe('10 days after done')
    expect(describeRepeat(task({ repeatMode: 'after_done', repeatUnit: 'week', repeatEvery: 1 }))).toBe('1 week after done')
  })
})

describe('dueLabel', () => {
  test('relative to today', () => {
    expect(dueLabel(null, TODAY)).toBe('No date')
    expect(dueLabel(TODAY, TODAY)).toBe('Today')
    expect(dueLabel('2026-10-31', TODAY)).toBe('Tomorrow')
    expect(dueLabel('2026-10-29', TODAY)).toBe('1 day overdue')
    expect(dueLabel('2026-10-25', TODAY)).toBe('5 days overdue')
    expect(dueLabel('2026-11-03', TODAY)).toBe('Tue')
  })
})

describe('groupByDue', () => {
  test('orders the groups and drops empty ones', () => {
    const groups = groupByDue(
      [
        task({ id: 'later', dueDate: '2026-12-01' }),
        task({ id: 'none' }),
        task({ id: 'late', dueDate: '2026-10-01' }),
        task({ id: 'today', dueDate: TODAY }),
        task({ id: 'week', dueDate: '2026-11-04' }),
      ],
      TODAY,
    )
    expect(groups.map((g) => [g.label, g.tasks.map((t) => t.id)])).toEqual([
      ['Overdue', ['late']],
      ['Today', ['today']],
      ['This week', ['week']],
      ['Later', ['later']],
      ['No date', ['none']],
    ])
  })
})
