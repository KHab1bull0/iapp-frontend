import { beforeEach, describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { createCategory, deleteCategory, fetchCategories, type Category } from '@/modules/finance/api/categories'
import { fetchCategoryParents } from '@/modules/finance/api/categoryParents'
import { CategoryFormPage } from './CategoryFormPage'

vi.mock('@/modules/finance/api/categories', async (orig) => ({
  ...(await orig<object>()),
  fetchCategories: vi.fn(),
  createCategory: vi.fn(),
  deleteCategory: vi.fn(),
}))
vi.mock('@/modules/finance/api/categoryParents', async (orig) => ({
  ...(await orig<object>()),
  fetchCategoryParents: vi.fn(),
}))

const SALARY: Category = { id: 'c1', name: 'Bonus', type: 'income', icon: '💰', color: '#22c55e', parentId: null }

function renderAt(path: string) {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/finance/settings/categories/new" element={<CategoryFormPage />} />
          <Route path="/finance/settings/categories/:id/edit" element={<CategoryFormPage />} />
          <Route path="/finance/settings/categories" element={<p>The list</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('CategoryFormPage', () => {
  beforeEach(() => {
    vi.mocked(fetchCategories).mockReset().mockResolvedValue([SALARY])
    vi.mocked(fetchCategoryParents).mockReset().mockResolvedValue([
      { id: 'p1', name: 'Work', type: 'income', color: '#22c55e', icon: '💼', createdAt: '' },
    ])
    vi.mocked(createCategory).mockReset().mockResolvedValue(SALARY)
    vi.mocked(deleteCategory).mockReset().mockResolvedValue()
  })

  test('a new one starts on the tab it came from; the preview follows the name; parents are chips', async () => {
    renderAt('/finance/settings/categories/new?type=income')
    expect(screen.getByRole('heading', { name: 'Add category' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Income' }).getAttribute('aria-pressed')).toBe('true')
    fireEvent.change(screen.getByPlaceholderText('e.g. Groceries'), { target: { value: 'Tips' } })
    expect(screen.getAllByText('Tips').length).toBeGreaterThan(0)
    fireEvent.click(await screen.findByRole('radio', { name: /Work/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))
    await waitFor(() =>
      expect(createCategory).toHaveBeenCalledWith(expect.objectContaining({ name: 'Tips', type: 'income', parentId: 'p1' })),
    )
    expect(await screen.findByText('The list')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull()
  })

  test('editing opens with its values and can delete it, after asking', async () => {
    renderAt('/finance/settings/categories/c1/edit')
    expect(await screen.findByDisplayValue('Bonus')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Edit category' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    const dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(deleteCategory).toHaveBeenCalledWith('c1'))
    expect(await screen.findByText('The list')).toBeTruthy()
  })

  test('an unknown id says so', async () => {
    renderAt('/finance/settings/categories/nope/edit')
    expect(await screen.findByText('Category not found')).toBeTruthy()
  })
})
