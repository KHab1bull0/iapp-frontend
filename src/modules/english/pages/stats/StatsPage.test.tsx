import { describe, expect, test, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import type { Stats } from '@/modules/english/api/english'
import { StatsPage } from './StatsPage'

const api = vi.hoisted(() => ({ fetchStats: vi.fn() }))
vi.mock('@/modules/english/api/english', async (orig) => ({ ...(await orig<object>()), ...api }))

const days = (n: number, from: string) =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date(`${from}T00:00:00`)
    d.setDate(d.getDate() + i)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })

const STATS: Stats = {
  total: 42,
  due: 7,
  overdue: 2,
  unseen: 5,
  addedThisWeek: 3,
  reviewedToday: 4,
  streak: 6,
  accuracy: { remembered: 30, forgot: 10 },
  levels: [
    { id: 'l0', name: 'New', locked: true, intervalDays: 0, count: 12 },
    { id: 'l3', name: 'Three days', locked: false, intervalDays: 3, count: 30 },
  ],
  categories: [
    { id: 'c1', name: 'Travel', count: 20 },
    { id: null, name: null, count: 22 },
  ],
  upcoming: days(7, '2026-11-01').map((date, i) => ({ date, count: i === 0 ? 9 : 0 })),
  activity: days(14, '2026-10-18').map((date) => ({ date, remembered: 1, forgot: 0 })),
}

function renderPage() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <StatsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('StatsPage', () => {
  test('shows the headline numbers, words per level and per category', async () => {
    api.fetchStats.mockResolvedValue(STATS)
    renderPage()
    expect(await screen.findByText('42')).toBeTruthy()
    expect(screen.getByText('+3 this week')).toBeTruthy()
    expect(screen.getByText('2 overdue')).toBeTruthy()
    expect(screen.getByText('75%')).toBeTruthy()
    expect(screen.getByText('6 days in a row')).toBeTruthy()

    const levels = screen.getByRole('region', { name: 'Words by level' })
    expect(within(levels).getByText('New')).toBeTruthy()
    expect(within(levels).getByText('30')).toBeTruthy()

    const cats = screen.getByRole('region', { name: 'Words by category' })
    expect(within(cats).getByText('No category')).toBeTruthy()
    expect(within(cats).getByText('Travel')).toBeTruthy()

    expect(screen.getByRole('region', { name: 'Next 7 days' })).toBeTruthy()
    expect(within(screen.getByRole('region', { name: 'Last 14 days' })).getAllByRole('listitem')).toHaveLength(14)
  })

  test('points to the vocabulary when there are no words', async () => {
    api.fetchStats.mockResolvedValue({ ...STATS, total: 0 })
    renderPage()
    expect(await screen.findByText('No words yet')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Open vocabulary' }).getAttribute('href')).toBe('/english/vocabulary')
  })

  test('speaks Uzbek', async () => {
    localStorage.setItem('iapp-lang', 'uz')
    api.fetchStats.mockResolvedValue(STATS)
    renderPage()
    expect(await screen.findByText("So'zlar")).toBeTruthy()
    expect(screen.getByRole('region', { name: "Darajalar bo'yicha" })).toBeTruthy()
    expect(screen.getByText('Yangi')).toBeTruthy()
    expect(screen.getByText('2 tasi kechikkan')).toBeTruthy()
  })
})
