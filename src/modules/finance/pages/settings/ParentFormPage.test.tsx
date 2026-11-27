import { beforeEach, describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { fetchCategories, type Category } from '@/modules/finance/api/categories'
import {
  createCategoryParent,
  deleteCategoryParent,
  fetchCategoryParents,
  updateCategoryParent,
  type CategoryParent,
} from '@/modules/finance/api/categoryParents'
import { ParentFormPage } from './ParentFormPage'

vi.mock('@/modules/finance/api/categories', async (orig) => ({
  ...(await orig<object>()),
  fetchCategories: vi.fn(),
}))
vi.mock('@/modules/finance/api/categoryParents', async (orig) => ({
  ...(await orig<object>()),
  fetchCategoryParents: vi.fn(),
  createCategoryParent: vi.fn(),
  updateCategoryParent: vi.fn(),
  deleteCategoryParent: vi.fn(),
}))

const TAXI: Category = { id: 'c1', name: 'Taxi', type: 'expense', icon: '🚕', color: '#336699', parentId: null }
const GAS: Category = { id: 'c2', name: 'Gas', type: 'expense', icon: '🔥', color: '#f97316', parentId: 'p1' }
const HOME: CategoryParent = { id: 'p1', name: 'Home bills', type: 'expense', color: '#3b82f6', icon: '🏠', createdAt: '' }

function renderAt(path: string) {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/finance/settings/parents/new" element={<ParentFormPage />} />
          <Route path="/finance/settings/parents/:id/edit" element={<ParentFormPage />} />
          <Route path="/finance/settings/categories" element={<p>The list</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ParentFormPage', () => {
  beforeEach(() => {
    vi.mocked(fetchCategories).mockReset().mockResolvedValue([TAXI, GAS])
    vi.mocked(fetchCategoryParents).mockReset().mockResolvedValue([HOME])
    for (const fn of [createCategoryParent, updateCategoryParent, deleteCategoryParent]) vi.mocked(fn).mockReset()
  })

  test('creates a parent with the unassigned categories chosen for it', async () => {
    vi.mocked(createCategoryParent).mockResolvedValue({ ...HOME, id: 'p9', name: 'Travel' })
    renderAt('/finance/settings/parents/new?type=expense')
    expect(await screen.findByRole('heading', { name: 'Add parent category' })).toBeTruthy()
    fireEvent.change(await screen.findByLabelText('Name'), { target: { value: '  Travel ' } })
    // Only unassigned ones (and its own) can go in.
    expect(screen.queryByRole('checkbox', { name: /Gas/ })).toBeNull()
    fireEvent.click(screen.getByRole('checkbox', { name: /Taxi/ }))
    fireEvent.click(screen.getByRole('button', { name: /Create/ }))
    await waitFor(() =>
      expect(createCategoryParent).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Travel', type: 'expense', categoryIds: ['c1'] }),
      ),
    )
    expect(await screen.findByText('The list')).toBeTruthy()
  })

  test("edits a parent's categories; its type is fixed", async () => {
    vi.mocked(updateCategoryParent).mockResolvedValue(HOME)
    renderAt('/finance/settings/parents/p1/edit')
    const gas = await screen.findByRole('checkbox', { name: /Gas/ })
    expect(gas.getAttribute('aria-checked')).toBe('true')
    expect(screen.queryByRole('button', { name: 'Income' })).toBeNull()
    fireEvent.click(gas)
    fireEvent.click(screen.getByRole('checkbox', { name: /Taxi/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(updateCategoryParent).toHaveBeenCalledWith('p1', expect.objectContaining({ name: 'Home bills', categoryIds: ['c1'] })),
    )
  })

  test('deletes a parent after confirming; its categories stay', async () => {
    vi.mocked(deleteCategoryParent).mockResolvedValue()
    renderAt('/finance/settings/parents/p1/edit')
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }))
    const dialog = await screen.findByRole('alertdialog')
    expect(within(dialog).getByText(/categories stay/)).toBeTruthy()
    expect(deleteCategoryParent).not.toHaveBeenCalled()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(deleteCategoryParent).toHaveBeenCalledWith('p1'))
  })

  test('a taken name is said so', async () => {
    vi.mocked(createCategoryParent).mockRejectedValue({ response: { status: 409, data: { message: 'errors.parent_exists' } } })
    renderAt('/finance/settings/parents/new')
    fireEvent.change(await screen.findByLabelText('Name'), { target: { value: 'Home bills' } })
    fireEvent.click(screen.getByRole('button', { name: /Create/ }))
    expect(await screen.findByText('A parent category with this name exists')).toBeTruthy()
  })

  test('an unknown id says so', async () => {
    renderAt('/finance/settings/parents/nope/edit')
    expect(await screen.findByText('Parent category not found')).toBeTruthy()
  })
})
