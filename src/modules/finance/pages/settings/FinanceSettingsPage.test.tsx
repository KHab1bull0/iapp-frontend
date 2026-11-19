import { beforeEach, describe, expect, test, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { createCategory, deleteCategory, fetchCategories, type Category } from '@/modules/finance/api/categories'
import { FinanceSettingsPage } from './FinanceSettingsPage'

vi.mock('@/modules/finance/api/categories', async (orig) => ({
  ...(await orig<object>()),
  fetchCategories: vi.fn(),
  createCategory: vi.fn(),
  deleteCategory: vi.fn(),
}))

const TAXI: Category = { id: 'c1', name: 'Taxi', type: 'expense', icon: '🚕', color: '#336699', parentId: null }

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
        <FinanceSettingsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('FinanceSettingsPage', () => {
  beforeEach(() => {
    vi.mocked(fetchCategories).mockReset()
    vi.mocked(createCategory).mockReset()
    vi.mocked(deleteCategory).mockReset()
    vi.mocked(fetchCategories).mockResolvedValue([TAXI])
  })

  test('category rows in outline while they load, marked busy and named', async () => {
    const cats = deferred<Category[]>()
    vi.mocked(fetchCategories).mockReturnValue(cats.promise)
    renderPage()

    const label = screen.getByText('Loading categories…')
    expect(label.closest('[aria-busy="true"]')).toBeTruthy()
    // Adding needs no list, so it stays available.
    expect(screen.getByRole('button', { name: /New category/ }).hasAttribute('disabled')).toBe(false)

    await act(async () => cats.resolve([TAXI]))
    expect(await screen.findByText('Taxi')).toBeTruthy()
    expect(screen.queryByText('Loading categories…')).toBeNull()
  })

  test('deleting a category disables its buttons and says so until the request settles', async () => {
    const del = deferred<void>()
    vi.mocked(deleteCategory).mockReturnValue(del.promise)
    renderPage()
    await screen.findByText('Taxi')

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    const dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }))

    const pending = await screen.findByRole('button', { name: 'Deleting…' })
    expect(pending.hasAttribute('disabled')).toBe(true)
    expect(screen.getByRole('button', { name: 'Edit' }).hasAttribute('disabled')).toBe(true)
    expect(pending.closest('[aria-busy="true"]')).toBeTruthy()

    vi.mocked(fetchCategories).mockResolvedValue([])
    await act(async () => del.resolve())
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Deleting…' })).toBeNull())
  })

  test('Create shows it is creating and is disabled until the request settles', async () => {
    const created = deferred<Category>()
    vi.mocked(createCategory).mockReturnValue(created.promise)
    renderPage()
    await screen.findByText('Taxi')

    fireEvent.click(screen.getByRole('button', { name: /New category/ }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByPlaceholderText('e.g. Groceries'), { target: { value: 'Books' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create' }))

    const pending = await within(dialog).findByRole('button', { name: 'Creating…' })
    expect(pending.hasAttribute('disabled')).toBe(true)
    expect(pending.getAttribute('aria-busy')).toBe('true')
    fireEvent.submit(pending.closest('form')!)
    expect(createCategory).toHaveBeenCalledOnce()

    await act(async () => created.resolve({ ...TAXI, id: 'c2', name: 'Books' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })
})
