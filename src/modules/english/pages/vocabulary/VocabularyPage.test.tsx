import { describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
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
    api.fetchWords.mockResolvedValue([
      word('ticket', { levelId: L3.id, tagIds: ['t1', 't2'], reviewOn: '2099-01-01', description: 'a paper that lets you travel' }),
      word('extraordinarily', { levelId: null, reviewOn: null }),
    ])
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
    expect(screen.getByText('a paper that lets you travel')).toBeTruthy()
    // A word not learned yet says so, beside the whole word.
    expect(screen.getByText('extraordinarily')).toBeTruthy()
    expect(screen.getByText('Not learned')).toBeTruthy()
    expect(screen.getByText('In the queue')).toBeTruthy()

    // Only the search is in the toolbar; the tag filter opens from the filter button.
    expect(screen.queryByRole('combobox')).toBeNull()
    expect(screen.queryByRole('link', { name: 'Import from Excel' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Filters' }))
    const sheet = await screen.findByRole('dialog', { name: 'Filters' })
    expect(within(sheet).getByRole('radiogroup', { name: 'Parts of speech' })).toBeTruthy()
    fireEvent.click(within(sheet).getByRole('radio', { name: /travel/ }))
    expect(api.fetchWords).toHaveBeenLastCalledWith(expect.objectContaining({ tagId: 't1' }))
  })
})
