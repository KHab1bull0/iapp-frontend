import { beforeEach, describe, expect, test, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { fetchCategories, type Category } from '@/modules/finance/api/categories'
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
