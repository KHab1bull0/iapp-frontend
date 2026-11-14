import { describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Task, TaskStats } from '@/modules/tasks/api/tasks'
import { habit, progress } from '@/modules/tasks/test-data'
import { toChartPoints } from './points'
import { TaskStatsCard } from './TaskStatsCard'

const api = vi.hoisted(() => ({ fetchTaskStats: vi.fn(), claimStage: vi.fn() }))
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
    { day: '2026-11-04', count: 1, cumulative: 10, score: 4, missed: 0 },
    { day: '2026-11-05', count: 0, cumulative: 10, score: 3, missed: 1 },
    { day: '2026-11-06', count: 2, cumulative: 12, score: 5, missed: 0 },
  ],
  monthly: [
    { month: '2026-10', count: 7, cumulative: 7, score: 6, missed: 1 },
    { month: '2026-11', count: 5, cumulative: 12, score: 5, missed: 2 },
  ],
}

function renderCard(task?: Task) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <TaskStatsCard taskId="t1" task={task} />
    </QueryClientProvider>,
  )
}

describe('TaskStatsCard', () => {
  test('shows the total, this month and the streak', async () => {
    api.fetchTaskStats.mockResolvedValue(STATS)
    renderCard()
    // The tile's number, not the chart's axis label.
    expect(await screen.findByText('12', { selector: 'div' })).toBeTruthy()
    expect(screen.getByText('5', { selector: 'div' })).toBeTruthy()
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
    expect(daily.map((p) => p.line)).toEqual([10, 10, 12])
    // One task's chart follows the score, which drops on a missed day.
    const scored = toChartPoints(STATS, 'daily', 'score')
    expect(scored.map((p) => p.line)).toEqual([4, 3, 5])
    expect(scored.map((p) => p.missed)).toEqual([0, 1, 0])
    // A day on the axis is just its number; the tooltip has the date.
    expect(daily[0].label).toBe('4')
    expect(daily[0].title).toMatch(/4 Nov/)
    const monthly = toChartPoints(STATS, 'monthly')
    expect(monthly.map((p) => p.label)).toEqual(['Oct', 'Nov'])
    expect(monthly[1].title).toBe('November 2026')
  })
})

describe('TaskStatsCard: a habit', () => {
  const READ = habit('read', {
    stages: [
      { id: 's1', position: 1, days: 3, reward: 'Coffee', reachedAt: '2026-11-01', claimedAt: '2026-11-01' },
      { id: 's2', position: 2, days: 4, reward: 'New mouse', reachedAt: '2026-11-05', claimedAt: null },
      { id: 's3', position: 3, days: 10, reward: 'A book', reachedAt: null, claimedAt: null },
      { id: 's4', position: 4, days: 30, reward: null, reachedAt: null, claimedAt: null },
    ],
    progress: progress({ streak: 4, stage: { position: 3, days: 10, reward: 'A book' } }),
  })

  test('lists the stages: taken, to take (claimed here), next with progress, ahead', async () => {
    api.fetchTaskStats.mockResolvedValue(STATS)
    api.claimStage.mockResolvedValue({})
    renderCard(READ)
    const list = (await screen.findByRole('heading', { name: 'Stages' })).parentElement!
    const rows = within(list).getAllByRole('listitem')
    expect(rows).toHaveLength(4)
    expect(within(rows[0]).getByText('Taken')).toBeTruthy()
    expect(within(rows[2]).getByRole('progressbar', { name: 'Stage 3 4/10' })).toBeTruthy()
    expect(within(rows[2]).getByText('4/10')).toBeTruthy()
    expect(within(rows[3]).getByText('Stage 4 · 30 days')).toBeTruthy()

    fireEvent.click(within(rows[1]).getByRole('button', { name: 'I took my reward' }))
    await waitFor(() => expect(api.claimStage).toHaveBeenCalledWith('s2', expect.anything()))
    expect(await within(rows[1]).findByText('Taken')).toBeTruthy()
  })

  test('the heatmap marks two-minute and rest days', async () => {
    api.fetchTaskStats.mockResolvedValue({
      ...STATS,
      daily: [
        { day: '2026-11-04', count: 1, cumulative: 10, score: 4, missed: 0, min: 1, rest: false },
        { day: '2026-11-05', count: 0, cumulative: 10, score: 4, missed: 0, min: 0, rest: true },
        { day: '2026-11-06', count: 1, cumulative: 11, score: 5, missed: 0, min: 0, rest: false },
      ],
    })
    renderCard(READ)
    expect(await screen.findByTitle(/two-minute version$/)).toBeTruthy()
    expect(screen.getByTitle(/rest day$/)).toBeTruthy()
    expect(screen.getByTitle(/done 1×$/)).toBeTruthy()
  })

  test('a weekly habit counts its streak in times', async () => {
    api.fetchTaskStats.mockResolvedValue(STATS)
    renderCard(habit('gym', { repeatUnit: 'week', repeatWeekdays: [1] }))
    expect(await screen.findByText('3 times')).toBeTruthy()
    expect(screen.getByText('Best: 7 times')).toBeTruthy()
  })
})
