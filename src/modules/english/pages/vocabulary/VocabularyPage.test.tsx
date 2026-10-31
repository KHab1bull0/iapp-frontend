import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { NEW, L3, word, category } from '@/modules/english/test-data'
import { VocabularyPage } from './VocabularyPage'

const api = vi.hoisted(() => ({ fetchWords: vi.fn(), fetchLevels: vi.fn(), fetchCategories: vi.fn() }))
vi.mock('@/modules/english/api/english', async (orig) => ({ ...(await orig<object>()), ...api }))

describe('VocabularyPage', () => {
  test('lists each word with its translation, level and category', async () => {
    api.fetchLevels.mockResolvedValue([NEW, L3])
    api.fetchCategories.mockResolvedValue([category('c1', 'Travel')])
    api.fetchWords.mockResolvedValue([word('ticket', { levelId: L3.id, categoryId: 'c1', reviewOn: '2099-01-01' })])
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <VocabularyPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )
    expect(await screen.findByText('ticket')).toBeTruthy()
    expect(screen.getByText('ticket-uz')).toBeTruthy()
    expect(screen.getAllByText('Three days').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Travel').length).toBeGreaterThan(0)
    expect(screen.getByRole('searchbox', { name: 'Search words' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Add word' })).toBeTruthy()
  })
})
