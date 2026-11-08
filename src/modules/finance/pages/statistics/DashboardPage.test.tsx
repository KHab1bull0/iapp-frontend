import { describe, expect, test, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { formatAmount } from '@/core/lib/format'
import { DashboardPage } from './DashboardPage'

const amount = (n: number) => formatAmount(n).replace(/\s+/g, ' ')

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
  test("leads with the month's balance, then income and expenses, the spending pace and one month switcher", async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )
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
