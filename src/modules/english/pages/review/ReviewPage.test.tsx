import { beforeEach, describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { todayYmd } from '@/core/lib/format'
import { NEW, L3, group, tag, word } from '@/modules/english/test-data'
import { ReviewPage } from './ReviewPage'

const api = vi.hoisted(() => ({
  fetchReview: vi.fn(),
  fetchLevels: vi.fn(),
  answerWord: vi.fn(),
  fetchStats: vi.fn(),
  fetchTags: vi.fn(),
  fetchGroups: vi.fn(),
}))
vi.mock('@/modules/english/api/english', async (orig) => ({ ...(await orig<object>()), ...api }))

function renderPage(path = '/english/review') {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[path]}>
        <ReviewPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ReviewPage', () => {
  beforeEach(() => {
    api.fetchLevels.mockResolvedValue([NEW, L3])
    api.fetchReview.mockResolvedValue([word('apple', { note: 'a fruit' }), word('river')])
    api.answerWord.mockResolvedValue(word('apple'))
    // No tag on any word yet: review starts straight away.
    api.fetchTags.mockResolvedValue([])
    api.fetchGroups.mockResolvedValue([])
  })

  describe('with tags on words, the tag cards come first', () => {
    beforeEach(() => {
      api.fetchTags.mockResolvedValue([
        tag('t1', 'family', { count: 10, due: 3 }),
        tag('t2', 'noun', { groupId: 'g1', count: 8, due: 0 }),
        tag('t3', 'empty', { count: 0, due: 0 }),
      ])
      api.fetchGroups.mockResolvedValue([group('g1', 'Parts of speech')])
    })

    test('All, then each worn tag by group with due today and in all; nothing due cannot be opened', async () => {
      renderPage()
      expect(await screen.findByRole('heading', { name: 'What shall we review?' })).toBeTruthy()
      const all = await screen.findByRole('link', { name: 'All: 2 today' })
      expect(all.getAttribute('href')).toBe('/english/review?tag=all')
      const family = screen.getByRole('link', { name: 'family: 3 due today, 10 in all' })
      expect(family.getAttribute('href')).toBe('/english/review?tag=t1')
      const pos = screen.getByRole('region', { name: 'Parts of speech' })
      expect(within(pos).queryByRole('link')).toBeNull()
      expect(within(pos).getByText('none today')).toBeTruthy()
      // A tag no word wears isn't offered.
      expect(screen.queryByText('empty')).toBeNull()
    })

    test("a tag's session asks only for its words, and names the tag", async () => {
      api.fetchReview.mockImplementation((_today: string, tagId?: string) =>
        Promise.resolve(tagId === 't1' ? [word('mother')] : [word('apple'), word('river')]),
      )
      renderPage('/english/review?tag=t1')
      expect(await screen.findByText('mother')).toBeTruthy()
      expect(api.fetchReview).toHaveBeenCalledWith(todayYmd(), 't1')
      expect(screen.getByText('family')).toBeTruthy()
      expect(screen.getByText('1 to go')).toBeTruthy()
    })
  })

  test('shows the word first, and the translation only when asked', async () => {
    renderPage()
    expect(await screen.findByText('apple')).toBeTruthy()
    expect(screen.getByText('2 to go')).toBeTruthy()
    expect(screen.queryByText('apple-uz')).toBeNull()
    expect(screen.queryByRole('group', { name: 'Which level does it go to?' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Show' }))
    expect(screen.getByText('apple-uz')).toBeTruthy()
    expect(screen.getByText('a fruit')).toBeTruthy()
  })

  test('once shown, every level is a chip; the picked one is sent for today', async () => {
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Show' }))
    const group = screen.getByRole('group', { name: 'Which level does it go to?' })
    const chips = within(group).getAllByRole('button')
    expect(chips.map((c) => c.getAttribute('aria-label'))).toEqual(['New, again today', 'Three days, 3 days'])
    fireEvent.click(chips[1])
    await waitFor(() => expect(api.answerWord).toHaveBeenCalledWith('apple', L3.id, todayYmd()))
  })

  test('the English description is on the front; the example comes with the answer', async () => {
    api.fetchReview.mockResolvedValue([
      word('harvest', { description: 'when crops are gathered', example: 'The harvest was good.', note: 'qishloqda' }),
    ])
    renderPage()
    expect(await screen.findByText('when crops are gathered')).toBeTruthy()
    expect(screen.queryByText('harvest-uz')).toBeNull()
    expect(screen.queryByText(/The harvest was good/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Show' }))
    expect(screen.getByText('harvest-uz')).toBeTruthy()
    expect(screen.getByText('qishloqda')).toBeTruthy()
    expect(screen.getByText(/The harvest was good/)).toBeTruthy()
  })

  test('UZ → EN asks from the translation; the English word, its description and sound come with the answer', async () => {
    api.fetchReview.mockResolvedValue([word('harvest', { description: 'when crops are gathered', note: 'qishloqda' })])
    Object.defineProperty(window, 'speechSynthesis', { value: { cancel() {}, speak() {} }, configurable: true })
    renderPage()
    await screen.findByText('harvest')
    expect(screen.getByRole('button', { name: 'Hear it' })).toBeTruthy()
    fireEvent.click(screen.getByRole('radio', { name: 'UZ → EN' }))
    expect(screen.getByText('harvest-uz')).toBeTruthy()
    expect(screen.queryByText('harvest')).toBeNull()
    expect(screen.queryByText('when crops are gathered')).toBeNull()
    expect(screen.queryByText('qishloqda')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Hear it' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Show' }))
    expect(screen.getByText('harvest')).toBeTruthy()
    expect(screen.getByText('when crops are gathered')).toBeTruthy()
    expect(screen.getByText('qishloqda')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Hear it' })).toBeTruthy()
    // Remembered for next time.
    expect(localStorage.getItem('iapp-review-direction')).toBe('uz-en')
    localStorage.removeItem('iapp-review-direction')
    Reflect.deleteProperty(window, 'speechSynthesis')
  })

  test('the summary counts a word kept at its level as forgot, and one moved up as remembered', async () => {
    api.fetchReview.mockReset()
    api.fetchReview
      .mockResolvedValueOnce([word('apple', { levelId: L3.id }), word('river')])
      .mockResolvedValueOnce([word('river')])
      .mockResolvedValue([])
    api.fetchStats.mockResolvedValue({ streak: 0, upcoming: [] })
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Show' }))
    fireEvent.click(screen.getByRole('button', { name: /^Three days/ })) // apple stays at Three days
    fireEvent.click(await screen.findByRole('button', { name: 'Show' }))
    fireEvent.click(screen.getByRole('button', { name: /^Three days/ })) // river: New → Three days
    expect(await screen.findByText('1 remembered, 1 forgot.')).toBeTruthy()
  })

  test('says so when the stack is empty', async () => {
    api.fetchReview.mockResolvedValue([])
    renderPage()
    expect(await screen.findByText('Nothing to memorise today')).toBeTruthy()
  })

  test('after answering, the word leaves at once and the next card starts hidden', async () => {
    api.answerWord.mockReturnValue(new Promise(() => {}))
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Show' }))
    fireEvent.click(screen.getByRole('button', { name: /^Three days/ }))
    expect(await screen.findByText('river')).toBeTruthy()
    expect(screen.queryByText('apple')).toBeNull()
    expect(screen.queryByText('river-uz')).toBeNull()
    expect(screen.getByText('1 to go')).toBeTruthy()
  })

  test('with only the starting level, it says to add levels', async () => {
    api.fetchLevels.mockResolvedValue([NEW])
    renderPage()
    const link = await screen.findByRole('link', { name: /Add review levels/ })
    expect(link.getAttribute('href')).toBe('/english/settings')
  })

  test('Space shows the answer and a number key picks that level', async () => {
    renderPage()
    await screen.findByText('apple')
    fireEvent.keyDown(window, { key: ' ' })
    expect(screen.getByText('apple-uz')).toBeTruthy()
    fireEvent.keyDown(window, { key: '1' })
    await waitFor(() => expect(api.answerWord).toHaveBeenCalledWith('apple', NEW.id, todayYmd()))
  })

  test('after the last card, a summary says how it went', async () => {
    api.fetchReview.mockReset()
    api.fetchReview.mockResolvedValueOnce([word('apple')]).mockResolvedValue([])
    api.fetchStats.mockResolvedValue({ streak: 3, upcoming: [{ date: '2099-01-01', count: 4 }] })
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Show' }))
    fireEvent.click(screen.getByRole('button', { name: /^New/ }))
    expect(await screen.findByRole('heading', { name: 'Well done!' })).toBeTruthy()
    expect(screen.getByText('0 remembered, 1 forgot.')).toBeTruthy()
    expect(await screen.findByText('3-day streak')).toBeTruthy()
    expect(screen.getByText('4 waiting tomorrow')).toBeTruthy()
  })
})
