import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { currentMonth, formatAmount } from '@/core/lib/format'
import { financeSummaryKey } from './api/summary'
import { FinanceHomeCard } from './FinanceHomeCard'

// Testing Library collapses the DOM's no-break spaces; do the same to the expectation.
const amount = (n: number) => formatAmount(n).replace(/\s+/g, ' ')

describe('FinanceHomeCard', () => {
  test("shows this month's balance, income and expense and links to finance", () => {
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

    expect(screen.getByText(amount(750000))).toBeTruthy()
    expect(screen.getByText(`+${amount(1000000)}`)).toBeTruthy()
    expect(screen.getByText(`−${amount(250000)}`)).toBeTruthy()
    expect(screen.getByRole('link').getAttribute('href')).toBe('/finance')
  })
})
