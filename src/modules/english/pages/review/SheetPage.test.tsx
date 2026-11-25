import { beforeEach, describe, expect, test, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { todayYmd } from '@/core/lib/format'
import { NEW, L3, tag, word } from '@/modules/english/test-data'
import { SheetPage } from './SheetPage'

const api = vi.hoisted(() => ({
  fetchReview: vi.fn(),
  fetchLevels: vi.fn(),
  fetchTags: vi.fn(),
}))
vi.mock('@/modules/english/api/english', async (orig) => ({ ...(await orig<object>()), ...api }))

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/english/review/sheet']}>
        <SheetPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return qc
}

describe('SheetPage', () => {
  beforeEach(() => {
    api.fetchLevels.mockResolvedValue([NEW, L3])
    api.fetchTags.mockResolvedValue([tag('t1', 'family', { count: 2 })])
    api.fetchReview.mockResolvedValue([
      word('apple', {
        translation: 'olma',
        description: 'a fruit',
        example: 'I ate an apple.',
        note: 'sanaladi',
        tagIds: ['t1'],
        levelId: L3.id,
      }),
      word('river'),
    ])
    localStorage.removeItem('iapp-extra-new')
  })

  test("lists every word of today's stack in full, in its order", async () => {
    renderPage()
    const apple = await screen.findByRole('article', { name: 'apple' })
    const all = screen.getAllByRole('article')
    expect(all.map((a) => a.getAttribute('aria-label'))).toEqual(['apple', 'river'])
    expect(screen.getByRole('heading', { name: 'Today · 2 words' })).toBeTruthy()
    for (const text of ['olma', 'a fruit', '“I ate an apple.”', 'Note', 'sanaladi', 'family', 'Three days']) {
      expect(within(apple).getByText(text)).toBeTruthy()
    }
  })

  test('a word without extras shows only what it has', async () => {
    renderPage()
    const river = await screen.findByRole('article', { name: 'river' })
    expect(within(river).getByText('river-uz')).toBeTruthy()
    expect(within(river).queryByText('Note')).toBeNull()
    expect(within(river).queryByText(/“/)).toBeNull()
    expect(within(river).queryByText('family')).toBeNull()
  })

  test('asks for the same stack as the session, extra new words included', async () => {
    localStorage.setItem('iapp-extra-new', JSON.stringify({ day: todayYmd(), n: 20 }))
    renderPage()
    await screen.findByRole('article', { name: 'apple' })
    await waitFor(() => expect(api.fetchReview).toHaveBeenCalledWith(todayYmd(), undefined, 20))
  })

  test('the only way out is back', async () => {
    renderPage()
    await screen.findByRole('article', { name: 'apple' })
    expect(screen.queryAllByRole('link')).toEqual([])
    for (const a of screen.getAllByRole('article')) expect(within(a).queryByRole('link')).toBeNull()
    expect(screen.getByRole('button', { name: /Back/ })).toBeTruthy()
  })

  test('a failed load offers retry, not "nothing today"', async () => {
    api.fetchReview.mockRejectedValueOnce(new Error('offline'))
    renderPage()
    const retry = await screen.findByRole('button', { name: 'Retry' })
    expect(screen.queryByText('Nothing to review today')).toBeNull()
    fireEvent.click(retry)
    expect(await screen.findByRole('article', { name: 'apple' })).toBeTruthy()
  })

  test('nothing today says so', async () => {
    api.fetchReview.mockResolvedValue([])
    renderPage()
    expect(await screen.findByText('Nothing to review today')).toBeTruthy()
    expect(screen.queryAllByRole('link')).toEqual([])
  })

  test('a failed refresh keeps the words already on the page', async () => {
    const qc = renderPage()
    await screen.findByRole('article', { name: 'apple' })
    api.fetchReview.mockRejectedValueOnce(new Error('offline'))
    await act(async () => {
      await qc.refetchQueries()
    })
    expect(api.fetchReview).toHaveBeenCalledTimes(2)
    await waitFor(() => expect(qc.getQueryCache().getAll().some((q) => q.state.status === 'error')).toBe(true))
    await act(async () => {})
    expect(screen.getByRole('article', { name: 'apple' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull()
  })
})
