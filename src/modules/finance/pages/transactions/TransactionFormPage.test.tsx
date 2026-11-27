import { beforeEach, describe, expect, test, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { fetchCategories, type Category } from '@/modules/finance/api/categories'
import { fetchCategoryParents, type CategoryParent } from '@/modules/finance/api/categoryParents'
import { createTransaction, fetchTransaction, type Transaction } from '@/modules/finance/api/transactions'
import { TransactionFormPage } from './TransactionFormPage'

vi.mock('@/modules/finance/api/transactions', async (orig) => ({
  ...(await orig<object>()),
  fetchTransaction: vi.fn(),
  createTransaction: vi.fn(),
}))
vi.mock('@/modules/finance/api/categories', async (orig) => ({
  ...(await orig<object>()),
  fetchCategories: vi.fn(),
}))
vi.mock('@/modules/finance/api/categoryParents', async (orig) => ({
  ...(await orig<object>()),
  fetchCategoryParents: vi.fn().mockResolvedValue([]),
}))

const TAXI: Category = { id: 'c1', name: 'Taxi', type: 'expense', icon: '🚕', color: '#336699', parentId: null }

/** A request that answers only when the test says so. */
function deferred<T>() {
  let resolve!: (v: T) => void
  const promise = new Promise<T>((r) => { resolve = r })
  return { promise, resolve }
}

function renderAt(path: string) {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/finance/transactions/new" element={<TransactionFormPage />} />
          <Route path="/finance/transactions/:id/edit" element={<TransactionFormPage />} />
          <Route path="/finance/transactions" element={<p>The list</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('TransactionFormPage while loading', () => {
  beforeEach(() => {
    vi.mocked(fetchTransaction).mockReset()
    vi.mocked(createTransaction).mockReset()
    vi.mocked(fetchCategories).mockReset()
    vi.mocked(fetchCategories).mockResolvedValue([TAXI])
  })

  test('editing: the form in outline while the transaction loads; Cancel works, Save waits', async () => {
    const one = deferred<Transaction>()
    vi.mocked(fetchTransaction).mockReturnValue(one.promise)
    renderAt('/finance/transactions/t1/edit')

    const label = screen.getByText('Loading the transaction…')
    expect(label.closest('[aria-busy="true"]')).toBeTruthy()
    expect(screen.getByText('Date')).toBeTruthy()
    expect(screen.queryByRole('textbox', { name: 'Amount' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Save changes' }).hasAttribute('disabled')).toBe(true)
    expect(screen.getByRole('button', { name: 'Cancel' }).hasAttribute('disabled')).toBe(false)

    await act(async () =>
      one.resolve({
        id: 't1',
        amount: 45000,
        currency: 'UZS',
        rate: null,
        baseAmount: 45000,
        type: 'expense',
        note: 'Airport',
        date: '2026-11-02',
        time: '09:30',
        createdAt: '2026-11-02T09:30:00Z',
        category: TAXI,
      }),
    )
    expect(await screen.findByDisplayValue('45 000')).toBeTruthy()
    expect(screen.queryByText('Loading the transaction…')).toBeNull()
  })

  test("categories still loading show chips in outline, not \"no categories\"", async () => {
    const cats = deferred<Category[]>()
    vi.mocked(fetchCategories).mockReturnValue(cats.promise)
    renderAt('/finance/transactions/new')

    const label = screen.getByText('Loading categories…')
    expect(label.closest('[aria-busy="true"]')).toBeTruthy()
    expect(screen.queryByText(/No categories of this type/)).toBeNull()

    await act(async () => cats.resolve([TAXI]))
    expect(await screen.findByRole('radio', { name: /Taxi/ })).toBeTruthy()
    expect(screen.queryByText('Loading categories…')).toBeNull()
  })

  test('Save shows it is saving and is disabled until the request settles', async () => {
    const saved = deferred<Transaction>()
    vi.mocked(createTransaction).mockReturnValue(saved.promise)
    renderAt('/finance/transactions/new')

    fireEvent.change(screen.getByRole('textbox', { name: 'Amount' }), { target: { value: '12000' } })
    fireEvent.click(await screen.findByRole('radio', { name: /Taxi/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    const pending = await screen.findByRole('button', { name: 'Saving…' })
    expect(pending.hasAttribute('disabled')).toBe(true)
    expect(pending.getAttribute('aria-busy')).toBe('true')
    // A second press while it runs sends nothing more.
    fireEvent.submit(pending.closest('form')!)
    expect(createTransaction).toHaveBeenCalledOnce()

    await act(async () => saved.resolve({} as Transaction))
    await waitFor(() => expect(screen.getByText('The list')).toBeTruthy())
  })
})

describe('TransactionFormPage: parent categories', () => {
  const HOME: CategoryParent = { id: 'p1', name: 'Home bills', type: 'expense', color: '#3b82f6', icon: '🏠', createdAt: '' }
  const EMPTY: CategoryParent = { id: 'p2', name: 'Nothing here', type: 'expense', color: '#3b82f6', icon: '📦', createdAt: '' }
  const GAS: Category = { id: 'c2', name: 'Gas', type: 'expense', icon: '🔥', color: '#f97316', parentId: 'p1' }
  const POWER: Category = { id: 'c3', name: 'Power', type: 'expense', icon: '⚡', color: '#eab308', parentId: 'p1' }
  const SALARY: Category = { id: 'c4', name: 'Salary', type: 'income', icon: '💰', color: '#22c55e', parentId: null }
  const openParent = () => screen.findByRole('button', { name: /Home bills/ })

  beforeEach(() => {
    localStorage.removeItem('iapp-recent-categories')
    vi.mocked(fetchTransaction).mockReset()
    vi.mocked(createTransaction).mockReset()
    vi.mocked(fetchCategories).mockResolvedValue([TAXI, GAS, POWER, SALARY])
    vi.mocked(fetchCategoryParents).mockResolvedValue([HOME, EMPTY])
  })

  test('a parent opens to its categories and closes again', async () => {
    renderAt('/finance/transactions/new')
    const parent = await openParent()
    expect(parent.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByRole('radio', { name: /Gas/ })).toBeNull()
    fireEvent.click(parent)
    expect(parent.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByRole('radio', { name: /Gas/ })).toBeTruthy()
    expect(screen.getByRole('radio', { name: /Power/ })).toBeTruthy()
    expect(screen.queryByRole('radio', { name: /Taxi/ })).toBeNull()
    fireEvent.click(parent)
    expect(screen.getByRole('radio', { name: /Taxi/ })).toBeTruthy()
    expect(screen.queryByRole('radio', { name: /Gas/ })).toBeNull()
  })

  test('a category is saved, never the parent', async () => {
    vi.mocked(createTransaction).mockResolvedValue({} as Transaction)
    renderAt('/finance/transactions/new')
    fireEvent.change(screen.getByRole('textbox', { name: 'Amount' }), { target: { value: '90000' } })
    fireEvent.click(await openParent())
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Select a category')).toBeTruthy()
    fireEvent.click(screen.getByRole('radio', { name: /Gas/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(createTransaction).toHaveBeenCalledWith(expect.objectContaining({ categoryId: 'c2' })))
  })

  test("editing a parent's category opens that parent with it chosen", async () => {
    vi.mocked(fetchTransaction).mockResolvedValue({
      id: 't1', amount: 90000, currency: 'UZS', rate: null, baseAmount: 90000, type: 'expense', note: null, date: '2026-11-02', time: '09:30',
      createdAt: '2026-11-02T09:30:00Z', category: GAS,
    })
    renderAt('/finance/transactions/t1/edit')
    const gas = await screen.findByRole('radio', { name: /Gas/ })
    expect(gas.getAttribute('aria-checked')).toBe('true')
    expect((await openParent()).getAttribute('aria-expanded')).toBe('true')
  })

  test('switching the type closes the parent and clears the choice', async () => {
    renderAt('/finance/transactions/new')
    fireEvent.click(await openParent())
    fireEvent.click(screen.getByRole('radio', { name: /Gas/ }))
    fireEvent.click(screen.getByRole('radio', { name: /Income/ }))
    expect(await screen.findByRole('radio', { name: /Salary/ })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Home bills/ })).toBeNull()
    fireEvent.click(screen.getByRole('radio', { name: /Expense/ }))
    const parent = await openParent()
    expect(parent.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByRole('radio', { checked: true, name: /Taxi|Gas|Power/ })).toBeNull()
  })

  test("categories show even while parents haven't come (or never do)", async () => {
    vi.mocked(fetchCategoryParents).mockReturnValue(new Promise(() => {}))
    renderAt('/finance/transactions/new')
    expect(await screen.findByRole('radio', { name: /Taxi/ })).toBeTruthy()
    expect(screen.getByRole('radio', { name: /Gas/ })).toBeTruthy()
  })

  test('a parent with no categories is not offered', async () => {
    renderAt('/finance/transactions/new')
    await openParent()
    expect(screen.queryByRole('button', { name: /Nothing here/ })).toBeNull()
  })

  test('closed, a parent shows the category chosen in it', async () => {
    renderAt('/finance/transactions/new')
    const parent = await openParent()
    fireEvent.click(parent)
    fireEvent.click(screen.getByRole('radio', { name: /Power/ }))
    fireEvent.click(parent)
    expect(parent.textContent).toContain('Power')
  })
})
