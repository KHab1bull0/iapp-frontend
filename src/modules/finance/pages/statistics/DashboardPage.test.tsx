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
    recentTransactions: [],
  }),
}))

describe('Statistics page', () => {
  test('the month picker sits inside the Balance card, and only there', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )
    const balance = (await screen.findByText('Balance')).closest('[data-stat]') as HTMLElement
    expect(within(balance).getByLabelText('Select month')).toBeTruthy()
    expect(screen.getAllByLabelText('Select month')).toHaveLength(1)
  })
})
