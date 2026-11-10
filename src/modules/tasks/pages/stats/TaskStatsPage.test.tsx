import { describe, expect, test, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import type { OverallTaskStats } from '@/modules/tasks/api/tasks'
import { TaskStatsPage } from './TaskStatsPage'

const api = vi.hoisted(() => ({ fetchOverallStats: vi.fn() }))
vi.mock('@/modules/tasks/api/tasks', async (orig) => ({ ...(await orig<object>()), ...api }))

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver

const kinds = { once: 0, daily: 0, weekly: 0, monthly: 0 }
const STATS: OverallTaskStats = {
  total: 40,
  thisMonth: 9,
  currentStreak: 4,
  bestStreak: 10,
  firstDoneOn: '2026-08-01',
  lastDoneOn: '2026-11-06',
  byKind: { once: 6, daily: 25, weekly: 8, monthly: 1 },
  daily: [{ day: '2026-11-06', count: 3, cumulative: 40, ...kinds, daily: 2, once: 1 }],
  monthly: [{ month: '2026-11', count: 9, cumulative: 40, ...kinds, daily: 9 }],
}

function renderPage() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <TaskStatsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('TaskStatsPage', () => {
  test('shows the totals and every repeat type', async () => {
    api.fetchOverallStats.mockResolvedValue(STATS)
    renderPage()
    // The tile's number, not the chart's axis label.
    expect(await screen.findByText('40', { selector: 'div' })).toBeTruthy()
    expect(screen.getByText('4 days')).toBeTruthy()
    const byKind = screen.getByRole('region', { name: 'By type' })
    expect(within(byKind).getAllByRole('listitem')).toHaveLength(4)
    expect(within(byKind).getByText('Daily')).toBeTruthy()
    expect(within(byKind).getByText('25')).toBeTruthy()
    expect(screen.getByRole('region', { name: 'Progress' })).toBeTruthy()
  })

  test('says so when nothing was done', async () => {
    api.fetchOverallStats.mockResolvedValue({ ...STATS, total: 0 })
    renderPage()
    expect(await screen.findByText('Nothing done yet')).toBeTruthy()
  })

  test('speaks Uzbek', async () => {
    localStorage.setItem('iapp-lang', 'uz')
    api.fetchOverallStats.mockResolvedValue(STATS)
    renderPage()
    expect(await screen.findByText('Jami bajarilgan')).toBeTruthy()
    expect(screen.getByRole('region', { name: "Turlari bo'yicha" })).toBeTruthy()
  })
})
