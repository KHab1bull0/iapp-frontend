import { describe, expect, test } from 'vitest'
import { parseQuickAdd } from './parseQuickAdd'

// A Friday.
const TODAY = '2026-11-06'

describe('parseQuickAdd', () => {
  test('plain text is just a title', () => {
    expect(parseQuickAdd('  Buy milk ', TODAY)).toEqual({ title: 'Buy milk', dueDate: null, dueTime: null, repeat: null })
  })

  test.each([
    ['bugun', '2026-11-06'],
    ['today', '2026-11-06'],
    ['ertaga', '2026-11-07'],
    ['Tomorrow', '2026-11-07'],
    ['indinga', '2026-11-08'],
    ['dushanba', '2026-11-09'],
    ['monday', '2026-11-09'],
    ['juma', '2026-11-06'],
    ['shanba', '2026-11-07'],
    ['yakshanba', '2026-11-08'],
  ])('"%s" sets the day', (word, day) => {
    const r = parseQuickAdd(`Kitob o'qish ${word}`, TODAY)
    expect(r.dueDate).toBe(day)
    expect(r.title).toBe("Kitob o'qish")
  })

  test.each([
    ['9:30', '09:30'],
    ['21.15', '21:15'],
    ['soat 7', '07:00'],
    ['at 18', '18:00'],
    ['7am', '07:00'],
    ['7 pm', '19:00'],
    ['12am', '00:00'],
  ])('"%s" sets the time', (word, time) => {
    const r = parseQuickAdd(`Call ${word}`, TODAY)
    expect(r.dueTime).toBe(time)
    expect(r.title).toBe('Call')
  })

  test('day, time and title together, in any order', () => {
    expect(parseQuickAdd("ertaga 9:00 bankka qo'ng'iroq", TODAY)).toEqual({
      title: "bankka qo'ng'iroq",
      dueDate: '2026-11-07',
      dueTime: '09:00',
      repeat: null,
    })
  })

  test.each([
    ['har kuni suv ichish', 'day', null],
    ['water every day', 'day', null],
    ['daily stretch', 'day', null],
    ['har oy ijara', 'month', null],
    ['har hafta tozalash', 'week', [5]],
  ])('"%s" repeats', (text, unit, weekdays) => {
    const r = parseQuickAdd(text, TODAY)
    expect(r.repeat).toEqual({ unit, weekdays })
  })

  test('"har dushanba" repeats on Mondays from the next Monday', () => {
    const r = parseQuickAdd('har dushanba sport 7am', TODAY)
    expect(r).toEqual({ title: 'sport', dueDate: '2026-11-09', dueTime: '07:00', repeat: { unit: 'week', weekdays: [1] } })
  })

  test('"every week" with a day starts and repeats on that day', () => {
    const r = parseQuickAdd('review every week wednesday', TODAY)
    expect(r.repeat).toEqual({ unit: 'week', weekdays: [3] })
    expect(r.dueDate).toBe('2026-11-11')
  })

  test('words inside other words are left alone', () => {
    const r = parseQuickAdd('Jumanazarga xat', TODAY)
    expect(r).toEqual({ title: 'Jumanazarga xat', dueDate: null, dueTime: null, repeat: null })
    expect(parseQuickAdd('Montreal trip', TODAY).dueDate).toBeNull()
  })

  test('a number that is not a time stays in the title', () => {
    expect(parseQuickAdd('Buy 3 apples', TODAY)).toMatchObject({ title: 'Buy 3 apples', dueTime: null })
  })
})
