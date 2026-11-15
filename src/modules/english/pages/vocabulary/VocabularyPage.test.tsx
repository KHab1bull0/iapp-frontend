import { describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { NEW, L3, word, tag, group } from '@/modules/english/test-data'
import { loadingRegion, pending } from '@/modules/english/test-loading'
import { VocabularyPage } from './VocabularyPage'

const api = vi.hoisted(() => ({ fetchWords: vi.fn(), fetchLevels: vi.fn(), fetchTags: vi.fn(), fetchGroups: vi.fn() }))
vi.mock('@/modules/english/api/english', async (orig) => ({ ...(await orig<object>()), ...api }))

function renderPage() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <VocabularyPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('VocabularyPage', () => {
  test('while the words load, the list is drawn as busy placeholder rows, not left blank', async () => {
    api.fetchLevels.mockResolvedValue([NEW])
    api.fetchTags.mockReturnValue(pending())
    api.fetchGroups.mockResolvedValue([])
    api.fetchWords.mockReturnValue(pending())
    renderPage()
    const region = loadingRegion()
    // The same section and heading the words will fill.
    expect(within(region).getByRole('heading', { name: 'Words' })).toBeTruthy()
    expect(screen.queryByText('No words yet')).toBeNull()
    // The search is usable at once.
    expect(screen.getByRole('searchbox', { name: 'Search words' })).toBeTruthy()

    // The filter sheet's chips wait as placeholders too, rather than "No tags yet".
    fireEvent.click(screen.getByRole('button', { name: 'Filters' }))
    const sheet = await screen.findByRole('dialog', { name: 'Filters' })
    expect(loadingRegion('Loading…', sheet)).toBeTruthy()
    expect(within(sheet).queryByText(/No tags yet/)).toBeNull()
  })

  test('a new search keeps the last list up, busy, until its words arrive', async () => {
    api.fetchLevels.mockResolvedValue([NEW])
    api.fetchTags.mockResolvedValue([])
    api.fetchGroups.mockResolvedValue([])
    api.fetchWords.mockResolvedValueOnce([word('ticket')]).mockReturnValue(pending())
    renderPage()
    expect(await screen.findByText('ticket')).toBeTruthy()
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search words' }), { target: { value: 'tra' } })
    await waitFor(() => expect(api.fetchWords).toHaveBeenCalledTimes(2))
    expect(screen.getByText('ticket').closest('[aria-busy="true"]')).toBeTruthy()
  })

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
    expect(within(sheet).getByRole('group', { name: 'Parts of speech' })).toBeTruthy()
    // Several tags can be picked; nothing is searched until Search.
    const calls = api.fetchWords.mock.calls.length
    fireEvent.click(within(sheet).getByRole('button', { name: /travel/ }))
    fireEvent.click(within(sheet).getByRole('button', { name: /noun/ }))
    expect(within(sheet).getByRole('button', { name: /travel/ }).getAttribute('aria-pressed')).toBe('true')
    expect(api.fetchWords.mock.calls.length).toBe(calls)
    fireEvent.click(within(sheet).getByRole('button', { name: 'Search' }))
    await waitFor(() =>
      expect(api.fetchWords).toHaveBeenLastCalledWith(expect.objectContaining({ tagIds: ['t1', 't2'] })),
    )
    expect(screen.getByRole('button', { name: 'Filters: 2 tags' })).toBeTruthy()
  })
})
