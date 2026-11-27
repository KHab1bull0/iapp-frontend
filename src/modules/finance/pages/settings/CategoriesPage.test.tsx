import { beforeEach, describe, expect, test, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { fetchCategories, type Category } from '@/modules/finance/api/categories'
import { fetchCategoryParents, type CategoryParent } from '@/modules/finance/api/categoryParents'
import { CategoriesPage } from './CategoriesPage'

vi.mock('@/modules/finance/api/categories', async (orig) => ({
  ...(await orig<object>()),
  fetchCategories: vi.fn(),
}))
vi.mock('@/modules/finance/api/categoryParents', async (orig) => ({
  ...(await orig<object>()),
  fetchCategoryParents: vi.fn(),
}))

const TAXI: Category = { id: 'c1', name: 'Taxi', type: 'expense', icon: '🚕', color: '#336699', parentId: null }
const GAS: Category = { id: 'c2', name: 'Gas', type: 'expense', icon: '🔥', color: '#f97316', parentId: 'p1' }
const BONUS: Category = { id: 'c3', name: 'Bonus', type: 'income', icon: '💰', color: '#22c55e', parentId: null }
const HOME: CategoryParent = { id: 'p1', name: 'Home bills', type: 'expense', color: '#3b82f6', icon: '🏠', createdAt: '' }

/** A request that answers only when the test says so. */
function deferred<T>() {
  let resolve!: (v: T) => void
  const promise = new Promise<T>((r) => { resolve = r })
  return { promise, resolve }
}

function renderPage(path = '/finance/settings/categories') {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[path]}>
        <CategoriesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('CategoriesPage', () => {
  beforeEach(() => {
    vi.mocked(fetchCategories).mockReset().mockResolvedValue([TAXI, GAS, BONUS])
    vi.mocked(fetchCategoryParents).mockReset().mockResolvedValue([HOME])
  })

  test('rows in outline while they load; adding needs no list', async () => {
    const cats = deferred<Category[]>()
    vi.mocked(fetchCategories).mockReturnValue(cats.promise)
    renderPage()
    expect(screen.getByText('Loading categories…').closest('[aria-busy="true"]')).toBeTruthy()
    expect(screen.getByRole('link', { name: /New category/ })).toBeTruthy()
    await act(async () => cats.resolve([TAXI]))
    expect(await screen.findByText('Taxi')).toBeTruthy()
  })

  test('each parent is a card with its categories; the rest are unassigned', async () => {
    renderPage()
    const home = await screen.findByRole('group', { name: 'Home bills' })
    expect(within(home).getByText('Gas')).toBeTruthy()
    expect(within(home).getByText('1 category')).toBeTruthy()
    expect(within(home).queryByText('Taxi')).toBeNull()
    expect(within(screen.getByRole('group', { name: 'Unassigned' })).getByText('Taxi')).toBeTruthy()
    // Income ones are on the other tab.
    expect(screen.queryByText('Bonus')).toBeNull()
  })

  test('every row opens its own page; no edit or delete buttons in the list', async () => {
    renderPage()
    const home = await screen.findByRole('group', { name: 'Home bills' })
    expect(within(home).getByRole('link', { name: /Home bills/ }).getAttribute('href')).toBe('/finance/settings/parents/p1/edit')
    expect(within(home).getByRole('link', { name: /Gas/ }).getAttribute('href')).toBe('/finance/settings/categories/c2/edit')
    expect(screen.queryByRole('button', { name: /Delete|Edit/ })).toBeNull()
  })

  test('the tab picks the type and goes with the add links', async () => {
    renderPage()
    await screen.findByText('Taxi')
    expect(screen.getByRole('link', { name: /New category/ }).getAttribute('href')).toBe(
      '/finance/settings/categories/new?type=expense',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Income' }))
    expect(await screen.findByText('Bonus')).toBeTruthy()
    expect(screen.queryByText('Taxi')).toBeNull()
    expect(screen.getByRole('link', { name: /New parent/ }).getAttribute('href')).toBe(
      '/finance/settings/parents/new?type=income',
    )
  })

  test('opened on the income tab (coming back from an income category), it stays there', async () => {
    renderPage('/finance/settings/categories?type=income')
    expect(await screen.findByText('Bonus')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Income' }).getAttribute('aria-pressed')).toBe('true')
  })
})
