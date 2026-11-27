import { beforeEach, describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { fetchCategories, type Category } from '@/modules/finance/api/categories'
import { createTransaction, updateTransaction, type Transaction } from '@/modules/finance/api/transactions'
import { fetchUsdRate } from '@/modules/finance/api/rates'
import { todayYmd } from '@/core/lib/format'
import { TransactionForm } from './TransactionForm'

vi.mock('@/modules/finance/api/transactions', async (orig) => ({
  ...(await orig<object>()),
  createTransaction: vi.fn(),
  updateTransaction: vi.fn(),
}))
vi.mock('@/modules/finance/api/categories', async (orig) => ({
  ...(await orig<object>()),
  fetchCategories: vi.fn(),
}))
vi.mock('@/modules/finance/api/categoryParents', async (orig) => ({
  ...(await orig<object>()),
  fetchCategoryParents: vi.fn().mockResolvedValue([]),
}))
vi.mock('@/modules/finance/api/rates', async (orig) => ({
  ...(await orig<object>()),
  fetchUsdRate: vi.fn(),
}))

const BOOKS: Category = { id: 'c1', name: 'Books', type: 'expense', icon: '📚', color: '#336699', parentId: null }

function renderForm(transaction?: Transaction) {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <TransactionForm transaction={transaction} onSaved={() => {}} onCancel={() => {}} />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const amount = () => screen.getByRole('textbox', { name: 'Amount' }) as HTMLInputElement
const rate = () => screen.getByRole('textbox', { name: /Rate/ }) as HTMLInputElement

describe('TransactionForm in dollars', () => {
  beforeEach(() => {
    vi.mocked(fetchCategories).mockResolvedValue([BOOKS])
    vi.mocked(createTransaction).mockReset().mockResolvedValue({} as Transaction)
    vi.mocked(updateTransaction).mockReset().mockResolvedValue({} as Transaction)
    vi.mocked(fetchUsdRate).mockReset().mockResolvedValue({ rate: 12_002.1, date: todayYmd(), source: 'cbu' })
  })

  test("so'm by default, with no rate asked", async () => {
    renderForm()
    await screen.findByRole('radio', { name: /Books/ })
    expect(screen.getByRole('button', { name: 'UZS' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.queryByRole('textbox', { name: /Rate/ })).toBeNull()
    expect(fetchUsdRate).not.toHaveBeenCalled()
  })

  test("USD: the bank's rate for the day, cents allowed, the so'm value shown, both sent", async () => {
    renderForm()
    fireEvent.click(await screen.findByRole('button', { name: 'USD' }))
    await waitFor(() => expect(rate().value).toBe('12 002.10'))
    expect(fetchUsdRate).toHaveBeenCalledWith(todayYmd())
    expect(screen.getByText(/Central Bank/)).toBeTruthy()

    fireEvent.change(amount(), { target: { value: '12.505' } })
    expect(amount().value).toBe('12.50')
    expect(screen.getByText(/150 026/)).toBeTruthy()

    fireEvent.click(screen.getByRole('radio', { name: /Books/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 12.5, currency: 'USD', rate: 12_002.1 }),
      ),
    )
  })

  test('the rate can be changed right there, and that is what is saved', async () => {
    renderForm()
    fireEvent.click(await screen.findByRole('button', { name: 'USD' }))
    await waitFor(() => expect(rate().value).toBe('12 002.10'))
    fireEvent.change(rate(), { target: { value: '12150' } })
    expect(rate().value).toBe('12 150')
    fireEvent.change(amount(), { target: { value: '10' } })
    expect(screen.getByText(/121 500/)).toBeTruthy()
    fireEvent.click(screen.getByRole('radio', { name: /Books/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(createTransaction).toHaveBeenCalledWith(expect.objectContaining({ rate: 12_150 })),
    )
  })

  test('own rate from settings: said so', async () => {
    vi.mocked(fetchUsdRate).mockResolvedValue({ rate: 12_300, source: 'manual' })
    renderForm()
    fireEvent.click(await screen.findByRole('button', { name: 'USD' }))
    await waitFor(() => expect(rate().value).toBe('12 300'))
    expect(screen.getByText(/your own rate/i)).toBeTruthy()
  })

  test('no rate known: asked for one before saving', async () => {
    vi.mocked(fetchUsdRate).mockResolvedValue({ rate: null })
    renderForm()
    fireEvent.click(await screen.findByRole('button', { name: 'USD' }))
    fireEvent.change(amount(), { target: { value: '10' } })
    fireEvent.click(screen.getByRole('radio', { name: /Books/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(createTransaction).not.toHaveBeenCalled()
  })

  test('editing a dollar one: its saved rate, not the bank’s today', async () => {
    renderForm({
      id: 't1',
      amount: 24.5,
      currency: 'USD',
      rate: 11_900,
      baseAmount: 291_550,
      type: 'expense',
      note: null,
      date: '2026-11-02',
      time: '13:30',
      createdAt: '2026-11-02T13:30:00Z',
      category: BOOKS,
    })
    expect(amount().value).toBe('24.50')
    expect(rate().value).toBe('11 900')
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() =>
      expect(updateTransaction).toHaveBeenCalledWith(
        't1',
        expect.objectContaining({ amount: 24.5, currency: 'USD', rate: 11_900 }),
      ),
    )
  })

  test("back to so'm: whole so'm, no rate sent", async () => {
    renderForm()
    fireEvent.click(await screen.findByRole('button', { name: 'USD' }))
    fireEvent.change(amount(), { target: { value: '12.5' } })
    fireEvent.click(screen.getByRole('button', { name: 'UZS' }))
    expect(amount().value).toBe('12')
    expect(screen.queryByRole('textbox', { name: /Rate/ })).toBeNull()
    fireEvent.click(screen.getByRole('radio', { name: /Books/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(createTransaction).toHaveBeenCalled())
    const sent = vi.mocked(createTransaction).mock.calls[0][0]
    expect(sent).toMatchObject({ amount: 12, currency: 'UZS' })
    expect(sent.rate).toBeUndefined()
  })
})
