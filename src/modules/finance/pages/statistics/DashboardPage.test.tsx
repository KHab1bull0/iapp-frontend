import { describe, expect, test, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { DashboardPage } from './DashboardPage'

vi.mock('@/modules/finance/api/stats', async (orig) => ({
  ...(await orig<object>()),
  fetchDashboard: vi.fn().mockResolvedValue({
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
  }),
}))

describe('Statistics page', () => {
  test('leads with what the month has cost, against last month, and one month switcher', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )
    const hero = await screen.findByRole('region', { name: 'Expenses' })
    expect(within(hero).getByText('25% more than by this day last month')).toBeTruthy()
    expect(screen.getAllByRole('group', { name: 'Select month' })).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Next month' }).hasAttribute('disabled')).toBe(true)
  })
})
