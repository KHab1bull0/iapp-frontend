import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Heatmap } from './Heatmap'

const days = [
  { day: '2026-11-02', count: 1 },
  { day: '2026-11-03', count: 0 },
  { day: '2026-11-04', count: 2 },
]

describe('Heatmap', () => {
  test('keeps the weekday names outside the part that scrolls', () => {
    const { container } = render(<Heatmap days={days} />)
    const grid = screen.getByRole('img')
    const weekdays = container.querySelector('[class*="weekdays"]')!
    const scroller = grid.closest('[class*="scroller"]')!
    expect(scroller).toBeTruthy()
    expect(scroller.contains(weekdays)).toBe(false)
  })

  test('compact uses the smaller squares', () => {
    const { container } = render(<Heatmap days={days} compact />)
    expect(container.firstElementChild!.className).toMatch(/compact/)
  })
})
