import { describe, expect, test, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Task, TaskStats } from '@/modules/tasks/api/tasks'
import { habit, progress } from '@/modules/tasks/test-data'
import { TaskStatsCard } from './TaskStatsCard'

const api = vi.hoisted(() => ({ fetchTaskStats: vi.fn() }))
vi.mock('@/modules/tasks/api/tasks', async (orig) => ({ ...(await orig<object>()), ...api }))

const STATS: TaskStats = {
  total: 12,
  currentStreak: 3,
  bestStreak: 7,
  firstDoneOn: '2026-09-01',
  lastDoneOn: '2026-11-06',
  daily: [
    { day: '2026-11-04', count: 1 },
    { day: '2026-11-05', count: 0 },
    { day: '2026-11-06', count: 2 },
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
  test('shows the streak with the best one, the total and the heatmap: nothing else', async () => {
    api.fetchTaskStats.mockResolvedValue(STATS)
    renderCard()
    expect(await screen.findByText('3 days')).toBeTruthy()
    expect(screen.getByText('Best: 7 days')).toBeTruthy()
    expect(screen.getByText('12', { selector: 'div' })).toBeTruthy()
    expect(screen.getByRole('img', { name: /active days/ })).toBeTruthy()
    // No chart, no period toggle, no "this month", no score rule.
    expect(screen.queryByRole('radiogroup')).toBeNull()
    expect(screen.queryByText('This month')).toBeNull()
    expect(screen.queryByText(/−1/)).toBeNull()
    expect(api.fetchTaskStats).toHaveBeenCalledWith('t1', expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/))
  })

  test('says so when the task was never done', async () => {
    api.fetchTaskStats.mockResolvedValue({ ...STATS, total: 0, currentStreak: 0, bestStreak: 0, firstDoneOn: null })
    renderCard()
    expect(await screen.findByText('Each day you do it is marked here.')).toBeTruthy()
    expect(screen.queryByRole('img', { name: /active days/ })).toBeNull()
  })
})

describe('TaskStatsCard: a habit', () => {
  const READ = habit('read', { progress: progress({ streak: 4 }) })

  test('the heatmap titles each day', async () => {
    api.fetchTaskStats.mockResolvedValue({
      ...STATS,
      daily: [
        { day: '2026-11-05', count: 0 },
        { day: '2026-11-06', count: 1 },
      ],
    })
    renderCard(READ)
    expect(await screen.findByTitle(/not done$/)).toBeTruthy()
    expect(screen.getByTitle(/done 1×$/)).toBeTruthy()
    expect(screen.queryByText('Rest')).toBeNull()
  })

  test('a weekly habit counts its streak in times', async () => {
    api.fetchTaskStats.mockResolvedValue(STATS)
    renderCard(habit('gym', { repeatUnit: 'week', repeatWeekdays: [1] }))
    expect(await screen.findByText('3 times')).toBeTruthy()
    expect(screen.getByText('Best: 7 times')).toBeTruthy()
  })

  test('while the numbers load: the card in outline', () => {
    api.fetchTaskStats.mockReturnValue(new Promise(() => {}))
    renderCard(READ)
    const card = screen.getByRole('region', { name: 'Task statistics' })
    expect(card.getAttribute('aria-busy')).toBe('true')
    expect(within(card).getByText('Loading…')).toBeTruthy()
    expect(within(card).queryByText('Best: 7 days')).toBeNull()
  })
})
