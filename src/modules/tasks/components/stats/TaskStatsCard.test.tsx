import { describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Task, TaskStats } from '@/modules/tasks/api/tasks'
import { habit, progress } from '@/modules/tasks/test-data'
import { TaskStatsCard } from './TaskStatsCard'

const api = vi.hoisted(() => ({ fetchTaskStats: vi.fn(), claimStage: vi.fn() }))
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

  test('the heatmap marks two-minute days', async () => {
    api.fetchTaskStats.mockResolvedValue({
      ...STATS,
      daily: [
        { day: '2026-11-04', count: 1, min: 1 },
        { day: '2026-11-05', count: 0, min: 0 },
        { day: '2026-11-06', count: 1, min: 0 },
      ],
    })
    renderCard(READ)
    expect(await screen.findByTitle(/two-minute version$/)).toBeTruthy()
    expect(screen.getByTitle(/not done$/)).toBeTruthy()
    expect(screen.getByTitle(/done 1×$/)).toBeTruthy()
    expect(screen.queryByText('Rest')).toBeNull()
  })

  test('a weekly habit counts its streak in times', async () => {
    api.fetchTaskStats.mockResolvedValue(STATS)
    renderCard(habit('gym', { repeatUnit: 'week', repeatWeekdays: [1] }))
    expect(await screen.findByText('3 times')).toBeTruthy()
    expect(screen.getByText('Best: 7 times')).toBeTruthy()
  })
})
