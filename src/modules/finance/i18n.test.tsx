import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { currentMonth } from '@/core/lib/format'
import { financeSummaryKey } from './api/summary'
import { FinanceHomeCard } from './FinanceHomeCard'
import { categoryName } from './i18n'

describe('finance in Uzbek', () => {
  test('the default categories are shown in the chosen language; others as they are', () => {
    expect(categoryName('Food & Dining', 'uz')).toBe('Oziq-ovqat')
    expect(categoryName('Salary', 'uz')).toBe('Maosh')
    expect(categoryName('Salary', 'en')).toBe('Salary')
    expect(categoryName('Coffee', 'uz')).toBe('Coffee')
  })

  test('the home card reads Uzbek', () => {
    localStorage.setItem('iapp-lang', 'uz')
    const qc = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } })
    qc.setQueryData(financeSummaryKey(currentMonth()), {
      month: currentMonth(),
      totalBalance: 1,
      totalIncome: 1,
      totalExpense: 0,
    })
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <FinanceHomeCard />
        </MemoryRouter>
      </QueryClientProvider>,
    )
    expect(screen.getByText('Moliya')).toBeTruthy()
    expect(screen.getByText('Balans')).toBeTruthy()
    expect(screen.getByText('Kirim')).toBeTruthy()
  })
})
