import { describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { TaskStats } from '@/modules/tasks/api/tasks'
import { toChartPoints } from './points'
import { TaskStatsCard } from './TaskStatsCard'

const api = vi.hoisted(() => ({ fetchTaskStats: vi.fn() }))
vi.mock('@/modules/tasks/api/tasks', async (orig) => ({ ...(await orig<object>()), ...api }))

// Recharts' ResponsiveContainer measures itself; jsdom has no ResizeObserver.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver

const STATS: TaskStats = {
  total: 12,
  thisMonth: 5,
  currentStreak: 3,
  bestStreak: 7,
  firstDoneOn: '2026-09-01',
  lastDoneOn: '2026-11-06',
  daily: [
    { day: '2026-11-04', count: 1, cumulative: 10 },
    { day: '2026-11-05', count: 0, cumulative: 10 },
    { day: '2026-11-06', count: 2, cumulative: 12 },
  ],
  monthly: [
    { month: '2026-10', count: 7, cumulative: 7 },
    { month: '2026-11', count: 5, cumulative: 12 },
  ],
}

function renderCard() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <TaskStatsCard taskId="t1" />
    </QueryClientProvider>,
  )
}

describe('TaskStatsCard', () => {
  test('shows the total, this month and the streak', async () => {
    api.fetchTaskStats.mockResolvedValue(STATS)
    renderCard()
    expect(await screen.findByText('12')).toBeTruthy()
    expect(screen.getByText('5')).toBeTruthy()
    expect(screen.getByText('3 days')).toBeTruthy()
    expect(screen.getByText('Best: 7 days')).toBeTruthy()
    expect(api.fetchTaskStats).toHaveBeenCalledWith('t1', expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/))
  })

  test('switches between days and months', async () => {
    api.fetchTaskStats.mockResolvedValue(STATS)
    renderCard()
    const days = await screen.findByRole('radio', { name: '30 days' })
    const months = screen.getByRole('radio', { name: '12 months' })
    expect(days.getAttribute('aria-checked')).toBe('true')
    fireEvent.click(months)
    expect(months.getAttribute('aria-checked')).toBe('true')
  })

  test('says so when the task was never done', async () => {
    api.fetchTaskStats.mockResolvedValue({ ...STATS, total: 0, thisMonth: 0, currentStreak: 0, bestStreak: 0, firstDoneOn: null })
    renderCard()
    expect(await screen.findByText('Each day you do it adds +1 and the line climbs.')).toBeTruthy()
    expect(screen.queryByRole('radiogroup')).toBeNull()
  })

  test('labels each point and keeps the running total from the server', () => {
    const daily = toChartPoints(STATS, 'daily')
    expect(daily.map((p) => p.cumulative)).toEqual([10, 10, 12])
    expect(daily[0].label).toBe('4 Nov')
    const monthly = toChartPoints(STATS, 'monthly')
    expect(monthly.map((p) => p.label)).toEqual(['Oct', 'Nov'])
    expect(monthly[1].title).toBe('November 2026')
  })
})
