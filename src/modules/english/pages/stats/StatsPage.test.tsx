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
  tags: [
    { id: 't1', name: 'Travel', groupId: null, count: 20 },
    { id: 't2', name: 'verb', groupId: 'g1', count: 0 },
  ],
  untagged: 22,
  upcoming: days(7, '2026-11-01').map((date, i) => ({ date, count: i === 0 ? 9 : 0 })),
  activity: days(14, '2026-10-18').map((date, i) => ({ date, remembered: i === 13 ? 3 : 1, forgot: i === 13 ? 1 : 0 })),
  growth: days(30, '2026-10-02').map((date, i) => ({ date, total: 20 + Math.floor(i / 2) })),
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
  test("today's stack as a ring, what was remembered and forgot, what is left", async () => {
    api.fetchStats.mockResolvedValue(STATS)
    renderPage()
    const today = await screen.findByRole('region', { name: 'Today' })
    // 4 answered today, 7 still due: 4 of 11.
    expect(within(today).getByRole('progressbar', { name: '4 of 11 answered today' })).toBeTruthy()
    expect(within(today).getByText('3')).toBeTruthy()
    expect(within(today).getByText(/2 overdue/)).toBeTruthy()
    expect(within(today).getByText('6 days in a row')).toBeTruthy()
    expect(within(today).getByRole('link', { name: 'Start review' }).getAttribute('href')).toBe('/english/review')

    const accuracy = screen.getByRole('region', { name: 'Remembered' })
    expect(within(accuracy).getByText('75%')).toBeTruthy()
  })

  test('the vocabulary split by level, its growth, tags and the two weeks around today', async () => {
    api.fetchStats.mockResolvedValue(STATS)
    renderPage()
    const vocab = await screen.findByRole('region', { name: 'Vocabulary' })
    expect(within(vocab).getByText('42')).toBeTruthy()
    expect(within(vocab).getByText('+3 this week')).toBeTruthy()
    // Words past New have been remembered at least once.
    expect(within(vocab).getByText('30 learned · 71%')).toBeTruthy()
    expect(within(vocab).getByRole('img').getAttribute('aria-label')).toBe('New: 12 words, 29%; Three days: 30 words, 71%')

    const growth = screen.getByRole('region', { name: 'Vocabulary growth · 30 days' })
    expect(within(growth).getByText('+14 words in 30 days')).toBeTruthy()

    const cats = screen.getByRole('region', { name: 'Words by tag' })
    expect(within(cats).getByText('No tag')).toBeTruthy()
    expect(within(cats).getByText('Travel')).toBeTruthy()
    // A tag no word wears yet isn't a bar.
    expect(within(cats).queryByText('verb')).toBeNull()

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
    expect(await screen.findByRole('region', { name: "Lug'at" })).toBeTruthy()
    expect(screen.getByText('Yangi')).toBeTruthy()
    expect(screen.getByText(/2 tasi kechikkan/)).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Yodlashni boshlash' })).toBeTruthy()
  })
})
