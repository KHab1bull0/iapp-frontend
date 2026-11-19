import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import type { OverallTaskStats } from '@/modules/tasks/api/tasks'
import { todayYmd } from '@/core/lib/format'
import { mondayOf } from '@/modules/tasks/review/week'
import { TaskStatsPage } from './TaskStatsPage'

const api = vi.hoisted(() => ({ fetchOverallStats: vi.fn() }))
vi.mock('@/modules/tasks/api/tasks', async (orig) => ({ ...(await orig<object>()), ...api }))
const reviews = vi.hoisted(() => ({ fetchWeek: vi.fn() }))
vi.mock('@/modules/tasks/api/reviews', async (orig) => ({ ...(await orig<object>()), ...reviews }))

const STATS: OverallTaskStats = {
  total: 40,
  currentStreak: 4,
  bestStreak: 10,
  firstDoneOn: '2026-08-01',
  lastDoneOn: '2026-11-06',
  daily: [{ day: '2026-11-06', count: 3 }],
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
  beforeEach(() => {
    reviews.fetchWeek.mockResolvedValue({ weekStart: mondayOf(todayYmd()), tasks: { done: 6, due: 8, rate: 75, missed: 2 } })
  })

  test("opens with the weekly review card and this week's rate", async () => {
    api.fetchOverallStats.mockResolvedValue(STATS)
    renderPage()
    const card = await screen.findByRole('link', { name: /Weekly review/ })
    expect(card.getAttribute('href')).toBe('/tasks/review')
    await waitFor(() => expect(card.textContent).toContain('This week: 75%'))
    expect(reviews.fetchWeek).toHaveBeenCalledWith(mondayOf(todayYmd()), todayYmd())
  })

  test('the card is there before anything is done, too', async () => {
    api.fetchOverallStats.mockResolvedValue({ ...STATS, total: 0 })
    renderPage()
    expect(await screen.findByText('Nothing done yet')).toBeTruthy()
    expect(screen.getByRole('link', { name: /Weekly review/ })).toBeTruthy()
  })

  test('the activity with the total across from it: no streak, no chart, no breakdown by type', async () => {
    api.fetchOverallStats.mockResolvedValue(STATS)
    renderPage()
    expect(await screen.findByText('40 times in all')).toBeTruthy()
    expect(screen.queryByText(/Best:/)).toBeNull()
    expect(screen.getByRole('region', { name: 'Activity' })).toBeTruthy()
    expect(screen.queryByRole('region', { name: 'By type' })).toBeNull()
    expect(screen.queryByRole('region', { name: 'Progress' })).toBeNull()
    expect(screen.queryByRole('radiogroup')).toBeNull()
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
    expect(await screen.findByText('Jami 40 marta')).toBeTruthy()
    expect(screen.getByRole('region', { name: 'Faollik' })).toBeTruthy()
  })

  test('while the numbers load: the heatmap in outline, the review card already there', () => {
    api.fetchOverallStats.mockReturnValue(new Promise(() => {}))
    reviews.fetchWeek.mockReturnValue(new Promise(() => {}))
    renderPage()
    const busy = screen.getByText('Loading…').closest('[aria-busy="true"]')
    expect(busy).toBeTruthy()
    expect(screen.getByRole('link', { name: /Weekly review/ })).toBeTruthy()
    expect(screen.queryByText('Nothing done yet')).toBeNull()
  })
})
