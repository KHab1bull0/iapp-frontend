import { beforeEach, describe, expect, test, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { deleteTransaction, fetchTransactions, type PaginatedTransactions, type Transaction } from '@/modules/finance/api/transactions'
import { fetchCategories } from '@/modules/finance/api/categories'
import { fetchCategoryParents } from '@/modules/finance/api/categoryParents'
import { periodRange } from '@/modules/finance/components/transactions/period'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { TransactionsPage } from './TransactionsPage'

vi.mock('@/modules/finance/api/transactions', async (orig) => ({
  ...(await orig<object>()),
  fetchTransactions: vi.fn(),
  deleteTransaction: vi.fn(),
}))
vi.mock('@/modules/finance/api/categories', async (orig) => ({
  ...(await orig<object>()),
  fetchCategories: vi.fn().mockResolvedValue([]),
}))
vi.mock('@/modules/finance/api/categoryParents', async (orig) => ({
  ...(await orig<object>()),
  fetchCategoryParents: vi.fn().mockResolvedValue([]),
}))

function tx(id: string, note: string, amount: number): Transaction {
  return {
    id,
    amount,
    type: 'expense',
    note,
    date: new Date().toISOString(),
    time: '12:00',
    createdAt: new Date().toISOString(),
    category: { id: 'c1', name: 'Transport', icon: '🚗', color: '#336699', parentId: null },
  }
}

function page(data: Transaction[]): PaginatedTransactions {
  return { data, page: 1, hasMore: false, limit: 20 }
}

/** A request that answers only when the test says so. */
function deferred<T>() {
  let resolve!: (v: T) => void
  const promise = new Promise<T>((r) => { resolve = r })
  return { promise, resolve }
}

function renderPage() {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <TransactionsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('TransactionsPage', () => {
  beforeEach(() => {
    vi.mocked(fetchTransactions).mockReset()
    vi.mocked(fetchTransactions).mockResolvedValue(page([]))
  })

  test('has no add button of its own: the shell "+" adds', () => {
    renderPage()
    expect(screen.queryByRole('button', { name: 'Add transaction' })).toBeNull()
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

  test('opens on the last 7 days', async () => {
    renderPage()
    await waitFor(() =>
      expect(fetchTransactions).toHaveBeenCalledWith(
        expect.objectContaining(periodRange('week', {})),
        1,
        20,
      ),
    )
  })

  test('Month and All change the dates sent', async () => {
    renderPage()
    const [toolbarPeriod] = screen.getAllByRole('radiogroup', { name: 'Period' })
    fireEvent.click(within(toolbarPeriod).getByRole('radio', { name: 'Month' }))
    await waitFor(() =>
      expect(fetchTransactions).toHaveBeenLastCalledWith(
        expect.objectContaining(periodRange('month', {})),
        1,
        20,
      ),
    )
    fireEvent.click(within(toolbarPeriod).getByRole('radio', { name: 'All' }))
    await waitFor(() => {
      const [q] = vi.mocked(fetchTransactions).mock.lastCall!
      expect(q.startDate).toBeUndefined()
      expect(q.endDate).toBeUndefined()
    })
  })

  test('Range shows date inputs and sends what is picked', async () => {
    renderPage()
    const [toolbarPeriod] = screen.getAllByRole('radiogroup', { name: 'Period' })
    fireEvent.click(within(toolbarPeriod).getByRole('radio', { name: 'Range' }))
    const [from] = screen.getAllByLabelText('From')
    const [to] = screen.getAllByLabelText('To')
    fireEvent.change(from, { target: { value: '2026-10-01' } })
    fireEvent.change(to, { target: { value: '2026-10-10' } })
    await waitFor(() =>
      expect(fetchTransactions).toHaveBeenLastCalledWith(
        expect.objectContaining({ startDate: '2026-10-01', endDate: '2026-10-10' }),
        1,
        20,
      ),
    )
  })
})

describe('TransactionsPage while loading', () => {
  beforeEach(() => {
    vi.mocked(fetchTransactions).mockReset()
    vi.mocked(deleteTransaction).mockReset()
  })

  test('the first load shows day groups of rows in outline, marked busy and named', () => {
    vi.mocked(fetchTransactions).mockReturnValue(new Promise(() => {}))
    renderPage()
    const label = screen.getByText('Loading transactions…')
    const block = label.closest('[aria-busy="true"]')!
    expect(block).toBeTruthy()
    expect(block.querySelectorAll('[aria-hidden]').length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: /^Edit:/ })).toBeNull()
    // The filters stay usable meanwhile.
    expect(screen.getByRole('searchbox', { name: 'Search transactions' })).toBeTruthy()
  })

  test('switching the period keeps the current list until the new one arrives', async () => {
    const monthly = deferred<PaginatedTransactions>()
    vi.mocked(fetchTransactions).mockImplementation((q) =>
      q.startDate === periodRange('month', {}).startDate ? monthly.promise : Promise.resolve(page([tx('a', 'Taxi', 30000)])),
    )
    renderPage()
    expect(await screen.findByText('Taxi')).toBeTruthy()

    const [toolbarPeriod] = screen.getAllByRole('radiogroup', { name: 'Period' })
    fireEvent.click(within(toolbarPeriod).getByRole('radio', { name: 'Month' }))
    await waitFor(() =>
      expect(fetchTransactions).toHaveBeenLastCalledWith(expect.objectContaining(periodRange('month', {})), 1, 20),
    )

    // Still the week's list, marked as updating; no skeleton in its place.
    expect(screen.getByText('Taxi').closest('[aria-busy="true"]')).toBeTruthy()
    expect(document.querySelector('[data-loading]')).toBeNull()

    await act(async () => monthly.resolve(page([tx('b', 'Groceries', 90000)])))
    expect(await screen.findByText('Groceries')).toBeTruthy()
    expect(screen.queryByText('Taxi')).toBeNull()
    expect(screen.getByText('Groceries').closest('[aria-busy="true"]')).toBeNull()
  })

  test('deleting a row disables its buttons and says so until the request settles', async () => {
    vi.mocked(fetchTransactions).mockResolvedValue(page([tx('a', 'Taxi', 30000)]))
    const del = deferred<void>()
    vi.mocked(deleteTransaction).mockReturnValue(del.promise)
    renderPage()
    await screen.findByText('Taxi')

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    const dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }))

    const pending = await screen.findByRole('button', { name: 'Deleting…' })
    expect(pending.hasAttribute('disabled')).toBe(true)
    expect(screen.getByRole('button', { name: /^Edit: Taxi/ }).hasAttribute('disabled')).toBe(true)
    expect(pending.closest('[aria-busy="true"]')).toBeTruthy()
    expect(deleteTransaction).toHaveBeenCalledOnce()

    vi.mocked(fetchTransactions).mockResolvedValue(page([]))
    await act(async () => del.resolve())
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Deleting…' })).toBeNull())
  })
})

describe('TransactionsPage: parent categories', () => {
  const HOME = { id: 'p1', name: 'Home bills', type: 'expense' as const, color: '#3b82f6', icon: '🏠', createdAt: '' }
  const GAS = { id: 'c2', name: 'Gas', type: 'expense' as const, icon: '🔥', color: '#f97316', parentId: 'p1' }
  const TAXI = { id: 'c1', name: 'Taxi', type: 'expense' as const, icon: '🚕', color: '#336699', parentId: null }

  beforeEach(() => {
    vi.mocked(fetchTransactions).mockReset()
    vi.mocked(fetchCategories).mockResolvedValue([TAXI, GAS])
    vi.mocked(fetchCategoryParents).mockResolvedValue([HOME])
  })

  test('filtering by a parent sends parentId, a category sends categoryId', async () => {
    vi.mocked(fetchTransactions).mockResolvedValue(page([]))
    renderPage()
    const select = screen.getByRole('combobox', { name: 'Category' }) as HTMLSelectElement
    await waitFor(() => expect(within(select).getByRole('option', { name: /All of Home bills/ })).toBeTruthy())
    fireEvent.change(select, { target: { value: 'p:p1' } })
    await waitFor(() =>
      expect(fetchTransactions).toHaveBeenLastCalledWith(expect.objectContaining({ parentId: 'p1', categoryId: undefined }), 1, 20),
    )
    fireEvent.change(select, { target: { value: 'c2' } })
    await waitFor(() =>
      expect(fetchTransactions).toHaveBeenLastCalledWith(expect.objectContaining({ categoryId: 'c2', parentId: undefined }), 1, 20),
    )
  })

  test("a parent's category shows the parent's name beside it", async () => {
    vi.mocked(fetchTransactions).mockResolvedValue(page([{ ...tx('a', 'Bill', 90000), category: GAS }]))
    renderPage()
    expect((await screen.findAllByText(/Gas · Home bills/)).length).toBeGreaterThan(0)
  })
})
