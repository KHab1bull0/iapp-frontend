import { describe, expect, test } from 'vitest'
import type { Task } from '@/modules/tasks/api/tasks'
import { describeRepeat, dueLabel, groupByDue } from './repeat'
import { tasksMessages } from '@/modules/tasks/i18n'

const en = tasksMessages.en
const uz = tasksMessages.uz

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
  repeatMonthDay: null,
  completedAt: null,
  createdAt: '',
  updatedAt: '',
  ...over,
})

describe('describeRepeat', () => {
  test('one-off tasks have no label', () => {
    expect(describeRepeat(task({}), en)).toBe('')
  })

  test('schedule in days, weeks and months', () => {
    expect(describeRepeat(task({ repeatMode: 'schedule', repeatUnit: 'day', repeatEvery: 1 }), en)).toBe('Every day')
    expect(describeRepeat(task({ repeatMode: 'schedule', repeatUnit: 'day', repeatEvery: 3 }), en)).toBe('Every 3 days')
    expect(
      describeRepeat(task({ repeatMode: 'schedule', repeatUnit: 'week', repeatEvery: 1, repeatWeekdays: [1, 3, 5] }), en),
    ).toBe('Mon · Wed · Fri')
    expect(
      describeRepeat(task({ repeatMode: 'schedule', repeatUnit: 'week', repeatEvery: 2, repeatWeekdays: [0] }), en),
    ).toBe('Every 2 weeks: Sun')
    expect(
      describeRepeat(task({ repeatMode: 'schedule', repeatUnit: 'month', repeatEvery: 1, dueDate: '2026-11-15' }), en),
    ).toBe('Every month on the 15th')
    expect(
      describeRepeat(task({ repeatMode: 'schedule', repeatUnit: 'month', repeatEvery: 3, dueDate: '2026-11-01' }), en),
    ).toBe('Every 3 months on the 1st')
    // The intended day, not February's clamped one.
    expect(
      describeRepeat(
        task({ repeatMode: 'schedule', repeatUnit: 'month', repeatEvery: 1, dueDate: '2026-02-28', repeatMonthDay: 31 }),
        en,
      ),
    ).toBe('Every month on the 31st')
  })

  test('after done', () => {
    expect(describeRepeat(task({ repeatMode: 'after_done', repeatUnit: 'day', repeatEvery: 10 }), en)).toBe('10 days after done')
    expect(describeRepeat(task({ repeatMode: 'after_done', repeatUnit: 'week', repeatEvery: 1 }), en)).toBe('1 week after done')
  })
})

describe('dueLabel', () => {
  test('relative to today', () => {
    expect(dueLabel(null, TODAY, en, 'en')).toBe('No date')
    expect(dueLabel(TODAY, TODAY, en, 'en')).toBe('Today')
    expect(dueLabel('2026-10-31', TODAY, en, 'en')).toBe('Tomorrow')
    expect(dueLabel('2026-10-29', TODAY, en, 'en')).toBe('1 day overdue')
    expect(dueLabel('2026-10-25', TODAY, en, 'en')).toBe('5 days overdue')
    expect(dueLabel('2026-11-03', TODAY, en, 'en')).toBe('Tue')
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
      en,
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

describe('in Uzbek', () => {
  test('repeats, due labels and groups read Uzbek', () => {
    expect(describeRepeat(task({ repeatMode: 'schedule', repeatUnit: 'day', repeatEvery: 3 }), uz)).toBe('Har 3 kunda')
    expect(describeRepeat(task({ repeatMode: 'schedule', repeatUnit: 'day', repeatEvery: 1 }), uz)).toBe('Har kuni')
    expect(
      describeRepeat(task({ repeatMode: 'schedule', repeatUnit: 'week', repeatEvery: 1, repeatWeekdays: [1, 3, 5] }), uz),
    ).toBe('Du · Ch · Ju')
    expect(
      describeRepeat(task({ repeatMode: 'schedule', repeatUnit: 'month', repeatEvery: 1, dueDate: '2026-11-15' }), uz),
    ).toBe('Har oyning 15-sanasida')
    expect(describeRepeat(task({ repeatMode: 'after_done', repeatUnit: 'day', repeatEvery: 10 }), uz)).toBe(
      'Bajarilgandan 10 kun keyin',
    )
    expect(dueLabel('2026-10-25', TODAY, uz, 'uz')).toBe('5 kun kechikdi')
    expect(dueLabel('2026-10-31', TODAY, uz, 'uz')).toBe('Ertaga')
    expect(groupByDue([task({ dueDate: TODAY })], TODAY, uz)[0].label).toBe('Bugun')
  })
})
