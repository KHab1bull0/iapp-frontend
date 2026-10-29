import { describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { fetchTransactions } from '@/modules/finance/api/transactions'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
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
      <MemoryRouter>
        <TransactionsPage />
      </MemoryRouter>
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

  test('the top toolbar has search, category and a button for the full filters', async () => {
    renderPage()
    expect(screen.getByRole('searchbox', { name: 'Search transactions' })).toBeTruthy()
    expect(screen.getByRole('combobox', { name: 'Category' })).toBeTruthy()

    const drawer = screen.getByRole('dialog', { name: 'Filters', hidden: true })
    expect(drawer.hasAttribute('inert')).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: /More filters/ }))
    expect(drawer.hasAttribute('inert')).toBe(false)
  })

  test('typing in the toolbar searches by note', async () => {
    renderPage()
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search transactions' }), {
      target: { value: 'coffee' },
    })
    await waitFor(() =>
      expect(fetchTransactions).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'coffee' }),
        1,
        20,
      ),
    )
  })
})
