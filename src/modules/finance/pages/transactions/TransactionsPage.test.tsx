import { beforeEach, describe, expect, test, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import {
  deleteTransaction,
  fetchTransactionTotals,
  fetchTransactions,
  type PaginatedTransactions,
  type Transaction,
} from '@/modules/finance/api/transactions'
import { fetchCategories } from '@/modules/finance/api/categories'
import { fetchCategoryParents } from '@/modules/finance/api/categoryParents'
import { fetchUsdRate } from '@/modules/finance/api/rates'
import { formatAmount } from '@/core/lib/format'
import { periodRange } from '@/modules/finance/components/transactions/period'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { TransactionsPage } from './TransactionsPage'

vi.mock('@/modules/finance/api/transactions', async (orig) => ({
  ...(await orig<object>()),
  fetchTransactions: vi.fn(),
  fetchTransactionTotals: vi.fn(),
  deleteTransaction: vi.fn(),
}))
vi.mock('@/modules/finance/api/rates', async (orig) => ({
  ...(await orig<object>()),
  fetchUsdRate: vi.fn(),
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
    currency: 'UZS',
    rate: null,
    baseAmount: amount,
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

const amount = (n: number) => formatAmount(n)

// Saved filters must not leak from one test into the next.
beforeEach(() => {
  sessionStorage.clear()
  vi.mocked(fetchTransactionTotals).mockReset()
  vi.mocked(fetchTransactionTotals).mockResolvedValue({ income: { count: 2, total: 13500000 }, expense: { count: 5, total: 125000 } })
  vi.mocked(fetchUsdRate).mockReset()
  vi.mocked(fetchUsdRate).mockResolvedValue({ rate: 12_002.1, date: '2026-11-27', source: 'cbu' })
})

const openDrawer = () => {
  fireEvent.click(screen.getByRole('button', { name: /^More filters/ }))
  return screen.getByRole('dialog', { name: 'Filters' })
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

  test('the top has Income and Expense with their counts, the category, and Filters; no search or period outside', async () => {
    renderPage()
    const income = await screen.findByRole('button', { name: /^Income/ })
    const expense = screen.getByRole('button', { name: /^Expense/ })
    expect(income.getAttribute('aria-pressed')).toBe('false')
    expect(expense.getAttribute('aria-pressed')).toBe('false')
    // The name on top with its count, the period's total under it.
    await waitFor(() => expect(income.getAttribute('aria-label')).toBe(`Income: 2, ${amount(13500000)} UZS`))
    expect(income.textContent).toContain(amount(13500000))
    expect(expense.textContent).toContain(amount(125000))
    expect(expense.getAttribute('aria-label')).toBe(`Expense: 5, ${amount(125000)} UZS`)
    expect(screen.getByRole('combobox', { name: 'Category' })).toBeTruthy()
    // Search and period live only in the (closed) Filters sheet.
    const drawer = screen.getByRole('dialog', { name: 'Filters', hidden: true })
    const outside = (els: HTMLElement[]) => els.filter((el) => !drawer.contains(el))
    expect(outside(screen.queryAllByRole('searchbox', { hidden: true }))).toEqual([])
    expect(outside(screen.queryAllByRole('radiogroup', { name: 'Period', hidden: true }))).toEqual([])
    // The counts follow the filters, never the type picked.
    await waitFor(() => expect(fetchTransactionTotals).toHaveBeenCalledWith(expect.objectContaining(periodRange('month', {}))))
  })

  test('Income filters to incomes; tapping it again shows everything', async () => {
    renderPage()
    const income = await screen.findByRole('button', { name: /^Income/ })
    fireEvent.click(income)
    expect(income.getAttribute('aria-pressed')).toBe('true')
    await waitFor(() =>
      expect(fetchTransactions).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'income' }), 1, 20),
    )
    expect(vi.mocked(fetchTransactionTotals).mock.lastCall![0].type).toBeUndefined()
    fireEvent.click(income)
    expect(income.getAttribute('aria-pressed')).toBe('false')
    await waitFor(() => expect(vi.mocked(fetchTransactions).mock.lastCall![0].type).toBeUndefined())
  })

  test('picking Expense after Income switches to expenses', async () => {
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: /^Income/ }))
    fireEvent.click(screen.getByRole('button', { name: /^Expense/ }))
    expect(screen.getByRole('button', { name: /^Income/ }).getAttribute('aria-pressed')).toBe('false')
    await waitFor(() =>
      expect(fetchTransactions).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'expense' }), 1, 20),
    )
  })

  test('the drawer holds the search first, then the period, and nothing else', () => {
    renderPage()
    const drawer = screen.getByRole('dialog', { name: 'Filters', hidden: true })
    expect(drawer.hasAttribute('inert')).toBe(true)
    openDrawer()
    expect(drawer.hasAttribute('inert')).toBe(false)
    const search = within(drawer).getByRole('searchbox', { name: 'Search transactions' })
    const period = within(drawer).getByRole('radiogroup', { name: 'Period' })
    expect(search.compareDocumentPosition(period) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(within(drawer).queryByRole('combobox')).toBeNull()
    expect(within(drawer).queryByRole('button', { name: 'Income' })).toBeNull()
  })

  test('searching in the drawer sends the search on Apply', async () => {
    renderPage()
    const drawer = openDrawer()
    fireEvent.change(within(drawer).getByRole('searchbox', { name: 'Search transactions' }), { target: { value: 'coffee' } })
    fireEvent.click(within(drawer).getByRole('button', { name: 'Search' }))
    await waitFor(() =>
      expect(fetchTransactions).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'coffee' }), 1, 20),
    )
  })

  test('opens on this month; the drawer periods read All, Month, Week, Range', async () => {
    renderPage()
    const period = within(openDrawer()).getByRole('radiogroup', { name: 'Period' })
    expect(within(period).getAllByRole('radio').map((r) => r.textContent)).toEqual(['All', 'Month', 'Week', 'Range'])
    expect(within(period).getByRole('radio', { name: 'Month' }).getAttribute('aria-checked')).toBe('true')
    await waitFor(() =>
      expect(fetchTransactions).toHaveBeenCalledWith(expect.objectContaining(periodRange('month', {})), 1, 20),
    )
  })

  test('All and Range from the drawer change the dates sent', async () => {
    renderPage()
    let drawer = openDrawer()
    fireEvent.click(within(drawer).getByRole('radio', { name: 'All' }))
    fireEvent.click(within(drawer).getByRole('button', { name: 'Search' }))
    await waitFor(() => {
      const [q] = vi.mocked(fetchTransactions).mock.lastCall!
      expect(q.startDate).toBeUndefined()
      expect(q.endDate).toBeUndefined()
    })
    drawer = openDrawer()
    fireEvent.click(within(drawer).getByRole('radio', { name: 'Range' }))
    fireEvent.change(within(drawer).getByLabelText('From'), { target: { value: '2026-10-01' } })
    fireEvent.change(within(drawer).getByLabelText('To'), { target: { value: '2026-10-10' } })
    fireEvent.click(within(drawer).getByRole('button', { name: 'Search' }))
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
    expect(screen.getByRole('combobox', { name: 'Category' })).toBeTruthy()
  })

  test('switching the period keeps the current list until the new one arrives', async () => {
    const weekly = deferred<PaginatedTransactions>()
    vi.mocked(fetchTransactions).mockImplementation((q) =>
      q.startDate === periodRange('week', {}).startDate ? weekly.promise : Promise.resolve(page([tx('a', 'Taxi', 30000)])),
    )
    renderPage()
    expect(await screen.findByText('Taxi')).toBeTruthy()

    const drawer = openDrawer()
    fireEvent.click(within(drawer).getByRole('radio', { name: 'Week' }))
    fireEvent.click(within(drawer).getByRole('button', { name: 'Search' }))
    await waitFor(() =>
      expect(fetchTransactions).toHaveBeenLastCalledWith(expect.objectContaining(periodRange('week', {})), 1, 20),
    )

    // Still the month's list, marked as updating; no skeleton in its place.
    expect(screen.getByText('Taxi').closest('[aria-busy="true"]')).toBeTruthy()
    expect(document.querySelector('[data-loading]')).toBeNull()

    await act(async () => weekly.resolve(page([tx('b', 'Groceries', 90000)])))
    expect(await screen.findByText('Groceries')).toBeTruthy()
    expect(screen.queryByText('Taxi')).toBeNull()
    expect(screen.getByText('Groceries').closest('[aria-busy="true"]')).toBeNull()
  })

  test('a row has no delete of its own: deleting is on its edit page', async () => {
    vi.mocked(fetchTransactions).mockResolvedValue(page([tx('a', 'Taxi', 30000)]))
    renderPage()
    await screen.findByText('Taxi')
    expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull()
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

  test("a dollar one shows dollars, with its so'm beside; the day's total is in so'm", async () => {
    vi.mocked(fetchTransactions).mockResolvedValue(
      page([
        { ...tx('a', 'Netflix', 9.99), currency: 'USD', rate: 12_000, baseAmount: 119_880 },
        tx('b', 'Taxi', 20_000),
      ]),
    )
    renderPage()
    expect((await screen.findAllByText('−$9.99')).length).toBeGreaterThan(0)
    // The page's text, spaces as the matcher sees them.
    const plain = (t: string) => t.replace(/\s/g, ' ')
    expect(screen.getByText(plain(`≈ ${amount(119_880)}`))).toBeTruthy()
    expect(screen.getByText(plain(`−${amount(139_880)}`))).toBeTruthy()
  })

  test("today's dollar rate sits on the page and opens its settings", async () => {
    vi.mocked(fetchTransactions).mockResolvedValue(page([]))
    renderPage()
    const badge = await screen.findByRole('link', { name: /1 USD = 12/ })
    expect(badge.getAttribute('href')).toBe('/finance/settings/rate')
  })
})

describe('TransactionsPage: filters kept', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.mocked(fetchTransactions).mockReset()
    vi.mocked(fetchTransactions).mockResolvedValue(page([]))
  })

  test('back from a transaction, the filters are as they were left', async () => {
    const first = renderPage()
    fireEvent.click(await screen.findByRole('button', { name: /^Expense/ }))
    const drawer = openDrawer()
    fireEvent.change(within(drawer).getByRole('searchbox', { name: 'Search transactions' }), { target: { value: 'coffee' } })
    fireEvent.click(within(drawer).getByRole('radio', { name: 'Week' }))
    fireEvent.click(within(drawer).getByRole('button', { name: 'Search' }))
    await waitFor(() =>
      expect(fetchTransactions).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'coffee' }), 1, 20),
    )
    first.unmount()

    vi.mocked(fetchTransactions).mockClear()
    renderPage()
    expect((await screen.findByRole('button', { name: /^Expense/ })).getAttribute('aria-pressed')).toBe('true')
    await waitFor(() =>
      expect(fetchTransactions).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'coffee', type: 'expense', ...periodRange('week', {}) }),
        1,
        20,
      ),
    )
  })

  test('a broken saved value falls back to the defaults', async () => {
    sessionStorage.setItem('iapp-finance-tx-filters', '{nope')
    renderPage()
    await waitFor(() =>
      expect(fetchTransactions).toHaveBeenCalledWith(expect.objectContaining(periodRange('month', {})), 1, 20),
    )
  })
})
