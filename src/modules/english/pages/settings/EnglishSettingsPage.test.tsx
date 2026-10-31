import { beforeEach, describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { NEW, L3, category } from '@/modules/english/test-data'
import { EnglishSettingsPage } from './EnglishSettingsPage'

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

function renderPage() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <EnglishSettingsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('EnglishSettingsPage', () => {
  beforeEach(() => {
    api.fetchLevels.mockResolvedValue([NEW, L3])
    api.fetchCategories.mockResolvedValue([category('c1', 'Travel')])
    api.createLevel.mockResolvedValue(L3)
    api.createCategory.mockResolvedValue(category('c2', 'Food'))
  })

  test('lists levels with their days; New cannot be deleted', async () => {
    renderPage()
    const levels = await screen.findByRole('region', { name: 'Levels' })
    expect(await within(levels).findByText('New')).toBeTruthy()
    expect(within(levels).getByText('3 days')).toBeTruthy()
    expect(within(levels).queryByRole('button', { name: 'Delete New' })).toBeNull()
    expect(within(levels).getByRole('button', { name: 'Delete Three days' })).toBeTruthy()
  })

  test('adds a level with a name and an interval', async () => {
    renderPage()
    const levels = await screen.findByRole('region', { name: 'Levels' })
    fireEvent.change(within(levels).getByLabelText('Level name'), { target: { value: 'Month' } })
    fireEvent.change(within(levels).getByLabelText('Days'), { target: { value: '30' } })
    fireEvent.click(within(levels).getByRole('button', { name: 'Add level' }))
    await waitFor(() => expect(api.createLevel).toHaveBeenCalledWith({ name: 'Month', intervalDays: 30 }))
  })

  test('lists categories with their date and adds one', async () => {
    renderPage()
    const cats = await screen.findByRole('region', { name: 'Categories' })
    expect(await within(cats).findByText('Travel')).toBeTruthy()
    fireEvent.change(within(cats).getByLabelText('Category name'), { target: { value: 'Food' } })
    fireEvent.click(within(cats).getByRole('button', { name: 'Add category' }))
    await waitFor(() => expect(api.createCategory).toHaveBeenCalledWith({ name: 'Food' }))
  })
})
