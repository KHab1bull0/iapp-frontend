import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { MobileFilterProvider } from '@/modules/finance/MobileFilterContext'
import { TransactionsPage } from './TransactionsPage'

vi.mock('@/modules/finance/api/transactions', async (orig) => ({
  ...(await orig<object>()),
  fetchTransactions: vi.fn().mockResolvedValue({ data: [], page: 1, hasMore: false }),
}))
vi.mock('@/modules/finance/api/categories', async (orig) => ({
  ...(await orig<object>()),
  fetchCategories: vi.fn().mockResolvedValue([]),
}))

function renderPage() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MobileFilterProvider>
        <MemoryRouter>
          <TransactionsPage />
        </MemoryRouter>
      </MobileFilterProvider>
    </QueryClientProvider>,
  )
}

describe('TransactionsPage', () => {
  test('has the floating add button and no title or header button', () => {
    renderPage()
    expect(screen.getAllByRole('button', { name: 'Add transaction' })).toHaveLength(1)
    expect(screen.queryByRole('heading', { name: 'Transactions' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Add' })).toBeNull()
  })
})
