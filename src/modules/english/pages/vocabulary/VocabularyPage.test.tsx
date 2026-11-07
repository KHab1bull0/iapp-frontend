import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { NEW, L3, word, tag, group } from '@/modules/english/test-data'
import { VocabularyPage } from './VocabularyPage'

const api = vi.hoisted(() => ({ fetchWords: vi.fn(), fetchLevels: vi.fn(), fetchTags: vi.fn(), fetchGroups: vi.fn() }))
vi.mock('@/modules/english/api/english', async (orig) => ({ ...(await orig<object>()), ...api }))

describe('VocabularyPage', () => {
  test('lists each word with its translation, level and tags', async () => {
    api.fetchLevels.mockResolvedValue([NEW, L3])
    api.fetchTags.mockResolvedValue([tag('t1', 'travel', { count: 1 }), tag('t2', 'noun', { groupId: 'g1', count: 1 })])
    api.fetchGroups.mockResolvedValue([group('g1', 'Parts of speech')])
    api.fetchWords.mockResolvedValue([word('ticket', { levelId: L3.id, tagIds: ['t1', 't2'], reviewOn: '2099-01-01' })])
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
    expect(await screen.findByText('travel, noun')).toBeTruthy()
    expect(screen.getByRole('searchbox', { name: 'Search words' })).toBeTruthy()
    // No filtering by level; search and tag only. Tags are listed by group.
    expect(screen.queryByRole('combobox', { name: 'Level' })).toBeNull()
    const filter = screen.getByRole('combobox', { name: 'Tag filter' })
    expect([...filter.querySelectorAll('optgroup')].map((g) => g.label)).toEqual(['Parts of speech', 'Ungrouped'])
  })
})
