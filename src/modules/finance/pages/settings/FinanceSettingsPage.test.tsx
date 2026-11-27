import { beforeEach, describe, expect, test, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { createCategory, deleteCategory, fetchCategories, updateCategory, type Category } from '@/modules/finance/api/categories'
import {
  createCategoryParent,
  deleteCategoryParent,
  fetchCategoryParents,
  updateCategoryParent,
  type CategoryParent,
} from '@/modules/finance/api/categoryParents'
import { FinanceSettingsPage } from './FinanceSettingsPage'

vi.mock('@/modules/finance/api/categories', async (orig) => ({
  ...(await orig<object>()),
  fetchCategories: vi.fn(),
  createCategory: vi.fn(),
  deleteCategory: vi.fn(),
  updateCategory: vi.fn(),
}))

const TAXI: Category = { id: 'c1', name: 'Taxi', type: 'expense', icon: '🚕', color: '#336699', parentId: null }

vi.mock('@/modules/finance/api/rates', async (orig) => ({
  ...(await orig<object>()),
  fetchBankUsdRate: vi.fn().mockResolvedValue({ rate: null }),
  fetchFinanceSettings: vi.fn().mockResolvedValue({ usdRate: null }),
}))
vi.mock('@/modules/finance/api/categoryParents', async (orig) => ({
  ...(await orig<object>()),
  fetchCategoryParents: vi.fn(),
  createCategoryParent: vi.fn(),
  updateCategoryParent: vi.fn(),
  deleteCategoryParent: vi.fn(),
}))

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
    vi.mocked(fetchCategoryParents).mockResolvedValue([])
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

describe('FinanceSettingsPage: parent categories', () => {
  const HOME: CategoryParent = { id: 'p1', name: 'Home bills', type: 'expense', color: '#3b82f6', icon: '🏠', createdAt: '' }
  const GAS: Category = { id: 'c2', name: 'Gas', type: 'expense', icon: '🔥', color: '#f97316', parentId: 'p1' }

  beforeEach(() => {
    for (const fn of [createCategoryParent, updateCategoryParent, deleteCategoryParent, updateCategory]) vi.mocked(fn).mockReset()
    vi.mocked(fetchCategories).mockResolvedValue([TAXI, GAS])
    vi.mocked(fetchCategoryParents).mockResolvedValue([HOME])
  })

  test('lists categories under their parent, the rest as unassigned', async () => {
    renderPage()
    const home = await screen.findByRole('group', { name: 'Home bills' })
    expect(within(home).getByText('Gas')).toBeTruthy()
    expect(within(home).queryByText('Taxi')).toBeNull()
    const loose = screen.getByRole('group', { name: 'Unassigned' })
    expect(within(loose).getByText('Taxi')).toBeTruthy()
  })

  test('creates a parent with the unassigned categories chosen for it', async () => {
    vi.mocked(createCategoryParent).mockResolvedValue({ ...HOME, id: 'p9', name: 'Travel' })
    renderPage()
    await screen.findByText('Taxi')
    fireEvent.click(screen.getByRole('button', { name: /New parent/ }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('Name'), { target: { value: '  Travel ' } })
    // Only unassigned ones (and its own) can go in.
    expect(within(dialog).queryByRole('checkbox', { name: /Gas/ })).toBeNull()
    fireEvent.click(within(dialog).getByRole('checkbox', { name: /Taxi/ }))
    fireEvent.click(within(dialog).getByRole('button', { name: /Create/ }))
    await waitFor(() =>
      expect(createCategoryParent).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Travel', type: 'expense', categoryIds: ['c1'] }),
      ),
    )
  })

  test("edits a parent's categories", async () => {
    vi.mocked(updateCategoryParent).mockResolvedValue(HOME)
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Edit Home bills' }))
    const dialog = await screen.findByRole('dialog')
    const gas = within(dialog).getByRole('checkbox', { name: /Gas/ }) as HTMLInputElement
    expect(gas.checked).toBe(true)
    fireEvent.click(gas)
    fireEvent.click(within(dialog).getByRole('checkbox', { name: /Taxi/ }))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(updateCategoryParent).toHaveBeenCalledWith('p1', expect.objectContaining({ name: 'Home bills', categoryIds: ['c1'] })),
    )
  })

  test('deletes a parent after confirming; its categories stay', async () => {
    vi.mocked(deleteCategoryParent).mockResolvedValue()
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Delete Home bills' }))
    const dialog = await screen.findByRole('alertdialog')
    expect(within(dialog).getByText(/categories stay/)).toBeTruthy()
    expect(deleteCategoryParent).not.toHaveBeenCalled()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(deleteCategoryParent).toHaveBeenCalledWith('p1'))
  })

  test('a taken name is said so', async () => {
    vi.mocked(createCategoryParent).mockRejectedValue({ response: { status: 409, data: { message: 'errors.parent_exists' } } })
    renderPage()
    await screen.findByText('Taxi')
    fireEvent.click(screen.getByRole('button', { name: /New parent/ }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('Name'), { target: { value: 'Home bills' } })
    fireEvent.click(within(dialog).getByRole('button', { name: /Create/ }))
    expect(await within(dialog).findByText('A parent category with this name exists')).toBeTruthy()
  })

  test('the category dialog puts a category in a parent', async () => {
    vi.mocked(updateCategory).mockResolvedValue({ ...TAXI, parentId: 'p1' })
    renderPage()
    const loose = await screen.findByRole('group', { name: 'Unassigned' })
    fireEvent.click(within(loose).getByRole('button', { name: 'Edit' }))
    const dialog = await screen.findByRole('dialog')
    // Opens with the category's own values, not a blank form.
    expect((within(dialog).getByPlaceholderText(/e.g./) as HTMLInputElement).value).toBe('Taxi')
    fireEvent.change(within(dialog).getByLabelText('Parent category'), { target: { value: 'p1' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(updateCategory).toHaveBeenCalledWith('c1', expect.objectContaining({ parentId: 'p1' })))
  })

  test('tapping the type that is already chosen keeps the parent', async () => {
    vi.mocked(updateCategory).mockResolvedValue(GAS)
    renderPage()
    const home = await screen.findByRole('group', { name: 'Home bills' })
    fireEvent.click(within(home).getByRole('button', { name: 'Edit' }))
    const dialog = await screen.findByRole('dialog')
    expect((within(dialog).getByLabelText('Parent category') as HTMLSelectElement).value).toBe('p1')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Expense' }))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(updateCategory).toHaveBeenCalledWith('c2', expect.objectContaining({ parentId: 'p1' })))
  })
})
