import { beforeEach, describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { NEW, L3, category } from '@/modules/english/test-data'
import { EnglishSettingsLayout } from './EnglishSettingsLayout'
import { EnglishSettingsIndex } from './EnglishSettingsIndex'
import { LevelsPage } from './LevelsPage'
import { CategoriesPage } from './CategoriesPage'

const api = vi.hoisted(() => ({
  fetchLevels: vi.fn(),
  createLevel: vi.fn(),
  updateLevel: vi.fn(),
  deleteLevel: vi.fn(),
  fetchCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}))
vi.mock('@/modules/english/api/english', async (orig) => ({ ...(await orig<object>()), ...api }))

function renderAt(path: string) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/english/settings" element={<EnglishSettingsLayout />}>
            <Route index element={<EnglishSettingsIndex />} />
            <Route path="levels" element={<LevelsPage />} />
            <Route path="categories" element={<CategoriesPage />} />
          </Route>
          <Route path="*" element={<p>elsewhere</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('English settings', () => {
  beforeEach(() => {
    api.fetchLevels.mockResolvedValue([NEW, L3])
    api.fetchCategories.mockResolvedValue([category('c1', 'Travel')])
    api.createLevel.mockResolvedValue(L3)
    api.createCategory.mockResolvedValue(category('c2', 'Food'))
  })

  test('the levels page shows only levels', async () => {
    renderAt('/english/settings/levels')
    expect(await screen.findByRole('region', { name: 'Levels' })).toBeTruthy()
    expect(screen.queryByRole('region', { name: 'Categories' })).toBeNull()
  })

  test('the categories page shows only categories', async () => {
    renderAt('/english/settings/categories')
    expect(await screen.findByRole('region', { name: 'Categories' })).toBeTruthy()
    expect(screen.queryByRole('region', { name: 'Levels' })).toBeNull()
  })

  test('the section list links to Levels and Categories', async () => {
    renderAt('/english/settings/levels')
    const nav = screen.getByRole('navigation', { name: 'English settings sections' })
    expect(within(nav).getByRole('link', { name: /Levels/ }).getAttribute('href')).toBe('/english/settings/levels')
    expect(within(nav).getByRole('link', { name: /Categories/ }).getAttribute('href')).toBe(
      '/english/settings/categories',
    )
  })

  test('lists levels with their days; New cannot be deleted', async () => {
    renderAt('/english/settings/levels')
    const levels = await screen.findByRole('region', { name: 'Levels' })
    expect(await within(levels).findByText('New')).toBeTruthy()
    expect(within(levels).getByText('3 days')).toBeTruthy()
    expect(within(levels).queryByRole('button', { name: 'Delete New' })).toBeNull()
    expect(within(levels).getByRole('button', { name: 'Delete Three days' })).toBeTruthy()
  })

  test('adds a level with a name and an interval', async () => {
    renderAt('/english/settings/levels')
    const levels = await screen.findByRole('region', { name: 'Levels' })
    fireEvent.change(within(levels).getByLabelText('Level name'), { target: { value: 'Month' } })
    fireEvent.change(within(levels).getByLabelText('Days'), { target: { value: '30' } })
    fireEvent.click(within(levels).getByRole('button', { name: 'Add level' }))
    await waitFor(() => expect(api.createLevel).toHaveBeenCalledWith({ name: 'Month', intervalDays: 30 }))
  })

  test('lists categories with their date and adds one', async () => {
    renderAt('/english/settings/categories')
    const cats = await screen.findByRole('region', { name: 'Categories' })
    expect(await within(cats).findByText('Travel')).toBeTruthy()
    fireEvent.change(within(cats).getByLabelText('Category name'), { target: { value: 'Food' } })
    fireEvent.click(within(cats).getByRole('button', { name: 'Add category' }))
    await waitFor(() => expect(api.createCategory).toHaveBeenCalledWith({ name: 'Food' }))
  })
})
