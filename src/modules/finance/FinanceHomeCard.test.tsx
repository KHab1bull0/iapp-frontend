import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { currentMonth, formatAmount } from '@/core/lib/format'
import { financeSummaryKey } from './api/summary'
import { FinanceHomeCard } from './FinanceHomeCard'

// Testing Library collapses the DOM's no-break spaces; do the same to the expectation.
const amount = (n: number) => formatAmount(n).replace(/\s+/g, ' ')

describe('FinanceHomeCard', () => {
  test("leads with this month's spending, then income and balance, and links to finance", () => {
    const qc = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } })
    const month = currentMonth()
    qc.setQueryData(financeSummaryKey(month), {
      month,
      totalBalance: 750000,
      totalIncome: 1000000,
      totalExpense: 250000,
    })

    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <FinanceHomeCard />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.getByText('Spent this month')).toBeTruthy()
    expect(screen.getByText(amount(250000))).toBeTruthy()
    expect(screen.getByText(`+${amount(1000000)}`)).toBeTruthy()
    expect(screen.getByText(amount(750000))).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Open Finance' }).getAttribute('href')).toBe('/finance')
    expect(screen.getByRole('button', { name: 'Add expense' })).toBeTruthy()
  })

  test('opened offline, the card waits instead of crashing', () => {
    // A paused query (no network) is pending but not fetching, so isLoading is false.
    onlineManager.setOnline(false)
    try {
      render(
        <QueryClientProvider client={new QueryClient()}>
          <MemoryRouter>
            <FinanceHomeCard />
          </MemoryRouter>
        </QueryClientProvider>,
      )
      expect(screen.getByText('Balance')).toBeTruthy()
    } finally {
      onlineManager.setOnline(true)
    }
  })
})
