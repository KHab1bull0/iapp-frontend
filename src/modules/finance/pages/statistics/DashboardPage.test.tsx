import { beforeEach, describe, expect, test, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { addMonths, currentMonth, formatAmount } from '@/core/lib/format'
import { fetchDashboard, type DashboardStats } from '@/modules/finance/api/stats'
import { DashboardPage } from './DashboardPage'

const amount = (n: number) => formatAmount(n).replace(/\s+/g, ' ')

const STATS: DashboardStats = {
  totalBalance: 750000,
  totalIncome: 1000000,
  totalExpense: 250000,
  categoryBreakdown: [],
  monthlyChart: [],
  dailySpend: [
    { day: 1, current: 100000, previous: 50000 },
    { day: 2, current: 250000, previous: 200000 },
  ],
  recentTransactions: [],
}

vi.mock('@/modules/finance/api/stats', async (orig) => ({
  ...(await orig<object>()),
  fetchDashboard: vi.fn(),
}))

function renderPage() {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

/** A request that answers only when the test says so. */
function deferred<T>() {
  let resolve!: (v: T) => void
  const promise = new Promise<T>((r) => { resolve = r })
  return { promise, resolve }
}

describe('Statistics page', () => {
  beforeEach(() => {
    vi.mocked(fetchDashboard).mockReset()
    vi.mocked(fetchDashboard).mockResolvedValue(STATS)
  })

  test("leads with the month's balance, then income and expenses, the spending pace and one month switcher", async () => {
    renderPage()
    const hero = await screen.findByRole('region', { name: 'Balance' })
    expect(within(hero).getByText(`+${amount(750000)}`)).toBeTruthy()
    expect(screen.getByText(`+${amount(1000000)}`)).toBeTruthy()
    expect(screen.getByText(`−${amount(250000)}`)).toBeTruthy()
    // The spending chart keeps its pace line but not the amount (the Expenses tile has it).
    const trend = screen.getByRole('region', { name: 'Expenses: this month and last' })
    expect(within(trend).getByText('25% more than by this day last month')).toBeTruthy()
    expect(within(trend).queryByText(amount(250000))).toBeNull()
    expect(screen.getAllByRole('group', { name: 'Select month' })).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Next month' }).hasAttribute('disabled')).toBe(true)
  })
})

describe('Statistics page while loading', () => {
  beforeEach(() => {
    vi.mocked(fetchDashboard).mockReset()
  })

  test('shows the cards in outline, marked busy and named, with the month switcher already usable', () => {
    vi.mocked(fetchDashboard).mockReturnValue(new Promise(() => {}))
    renderPage()
    const label = screen.getByText('Loading statistics…')
    expect(label.closest('[aria-busy="true"]')).toBeTruthy()
    // The card titles are in place; the figures are not.
    expect(screen.getByText('Balance')).toBeTruthy()
    expect(screen.getByText('Spending by category')).toBeTruthy()
    expect(screen.getByText('Last 6 months')).toBeTruthy()
    expect(screen.queryByRole('region', { name: 'Balance' })).toBeNull()
    expect(screen.getAllByRole('group', { name: 'Select month' })).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Previous month' }).hasAttribute('disabled')).toBe(false)
  })

  test("stepping to another month keeps this month's figures until the new ones arrive", async () => {
    const prev = addMonths(currentMonth(), -1)
    const next = deferred<DashboardStats>()
    vi.mocked(fetchDashboard).mockImplementation((month) =>
      month === prev ? next.promise : Promise.resolve(STATS),
    )
    renderPage()
    await screen.findByRole('region', { name: 'Balance' })

    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }))
    await waitFor(() => expect(fetchDashboard).toHaveBeenLastCalledWith(prev))

    // No skeleton: the old figures stay, and the page says it is updating.
    const hero = screen.getByRole('region', { name: 'Balance' })
    expect(within(hero).getByText(`+${amount(750000)}`)).toBeTruthy()
    expect(document.querySelector('[data-loading]')).toBeNull()
    expect(hero.closest('[aria-busy="true"]')).toBeTruthy()
    expect(screen.getByText('Loading statistics…')).toBeTruthy()

    await act(async () => next.resolve({ ...STATS, totalBalance: 120000, totalIncome: 300000, totalExpense: 180000 }))
    const fresh = await screen.findByRole('region', { name: 'Balance' })
    await waitFor(() => expect(within(fresh).getByText(`+${amount(120000)}`)).toBeTruthy())
    expect(within(fresh).queryByText(`+${amount(750000)}`)).toBeNull()
    expect(document.querySelector('[aria-busy="true"]')).toBeNull()
  })

  test('a failed load still shows the error with a retry', async () => {
    vi.mocked(fetchDashboard).mockRejectedValue(new Error('offline'))
    renderPage()
    expect(await screen.findByText('Failed to load statistics')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy()
  })
})
