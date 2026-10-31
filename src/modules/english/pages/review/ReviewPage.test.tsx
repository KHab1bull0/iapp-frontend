import { beforeEach, describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { todayYmd } from '@/core/lib/format'
import { NEW, L3, word } from '@/modules/english/test-data'
import { ReviewPage } from './ReviewPage'

const api = vi.hoisted(() => ({
  fetchReview: vi.fn(),
  fetchLevels: vi.fn(),
  answerWord: vi.fn(),
}))
vi.mock('@/modules/english/api/english', async (orig) => ({ ...(await orig<object>()), ...api }))

function renderPage() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
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
  })

  test('shows the word first, and the translation only when asked', async () => {
    renderPage()
    expect(await screen.findByText('apple')).toBeTruthy()
    expect(screen.getByText('2 to go')).toBeTruthy()
    expect(screen.queryByText('apple-uz')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Remembered' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Show' }))
    expect(screen.getByText('apple-uz')).toBeTruthy()
    expect(screen.getByText('a fruit')).toBeTruthy()
  })

  test('remembered and forgot are sent for today', async () => {
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Show' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remembered' }))
    await waitFor(() => expect(api.answerWord).toHaveBeenCalledWith('apple', 'remembered', todayYmd()))
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
    fireEvent.click(screen.getByRole('button', { name: 'Remembered' }))
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
})
