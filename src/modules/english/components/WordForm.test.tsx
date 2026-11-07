import { beforeEach, describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { addDaysYmd, formatDay, todayYmd, ymd } from '@/core/lib/format'
import { L3, NEW, category, word } from '@/modules/english/test-data'
import { WordForm } from './WordForm'

const api = vi.hoisted(() => ({
  createWord: vi.fn(),
  updateWord: vi.fn(),
  deleteWord: vi.fn(),
  fetchCategories: vi.fn(),
  fetchLevels: vi.fn(),
}))
vi.mock('@/modules/english/api/english', async (orig) => ({ ...(await orig<object>()), ...api }))

function renderForm() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <WordForm word={null} onSaved={() => {}} onCancel={() => {}} />
    </QueryClientProvider>,
  )
}

describe('WordForm', () => {
  beforeEach(() => {
    api.createWord.mockResolvedValue({ id: 'n' })
    api.updateWord.mockResolvedValue({ id: 'w1' })
    api.fetchLevels.mockResolvedValue([NEW, L3])
  })

  test('a new word is due today unless another day is picked, and has no category picker without categories', async () => {
    api.fetchCategories.mockResolvedValue([])
    renderForm()
    expect(screen.getByRole('button', { name: 'Memorise on: Today' })).toBeTruthy()
    await waitFor(() => expect(api.fetchCategories).toHaveBeenCalled())
    expect(screen.queryByRole('radiogroup', { name: 'Category' })).toBeNull()

    fireEvent.change(screen.getByLabelText('Word'), { target: { value: 'apple' } })
    fireEvent.change(screen.getByLabelText('Translation'), { target: { value: 'olma' } })
    fireEvent.click(screen.getByRole('button', { name: 'Memorise on: Today' }))
    fireEvent.click(screen.getByRole('button', { name: 'Tomorrow' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(api.createWord).toHaveBeenCalledWith(
        expect.objectContaining({ word: 'apple', translation: 'olma', reviewOn: addDaysYmd(todayYmd(), 1), categoryId: null }),
      ),
    )
  })

  test('with categories, one can be picked from chips, optionally', async () => {
    api.fetchCategories.mockResolvedValue([category('c1', 'Travel'), category('c2', 'Work')])
    renderForm()
    const chips = await screen.findByRole('radiogroup', { name: 'Category' })
    expect(within(chips).getAllByRole('radio').map((c) => c.textContent)).toEqual(['None', 'Travel', 'Work'])
    expect(within(chips).getByRole('radio', { name: 'None' }).getAttribute('aria-checked')).toBe('true')
    fireEvent.click(within(chips).getByRole('radio', { name: 'Travel' }))
    expect(within(chips).getByRole('radio', { name: 'Travel' }).getAttribute('aria-checked')).toBe('true')
    fireEvent.change(screen.getByLabelText('Word'), { target: { value: 'ticket' } })
    fireEvent.change(screen.getByLabelText('Translation'), { target: { value: 'chipta' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(api.createWord).toHaveBeenCalledWith(expect.objectContaining({ categoryId: 'c1' })),
    )
  })

  test('a new word starts at New, and can be given another level when adding', async () => {
    api.fetchCategories.mockResolvedValue([])
    renderForm()
    const levels = await screen.findByRole('radiogroup', { name: 'Level' })
    await waitFor(() => expect(within(levels).getByRole('radio', { name: 'New' }).getAttribute('aria-checked')).toBe('true'))
    fireEvent.click(within(levels).getByRole('radio', { name: 'Three days, 3 days' }))
    const inThree = new Date()
    inThree.setDate(inThree.getDate() + 3)
    expect(screen.getByRole('button', { name: `Memorise on: ${formatDay(ymd(inThree))}` })).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Word'), { target: { value: 'harbour' } })
    fireEvent.change(screen.getByLabelText('Translation'), { target: { value: 'port' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(api.createWord).toHaveBeenCalledWith(
        expect.objectContaining({ levelId: L3.id, reviewOn: ymd(inThree) }),
      ),
    )
  })

  test('editing can move a word to another level, which reschedules it', async () => {
    api.fetchCategories.mockResolvedValue([])
    render(
      <QueryClientProvider client={new QueryClient()}>
        <WordForm word={word('w1', { levelId: NEW.id })} onSaved={() => {}} onCancel={() => {}} />
      </QueryClientProvider>,
    )
    const levels = await screen.findByRole('radiogroup', { name: 'Level' })
    await waitFor(() => expect(within(levels).getAllByRole('radio')).toHaveLength(2))
    expect(within(levels).getByRole('radio', { name: 'New' }).getAttribute('aria-checked')).toBe('true')
    fireEvent.click(within(levels).getByRole('radio', { name: 'Three days, 3 days' }))
    expect(within(levels).getByRole('radio', { name: 'Three days, 3 days' }).getAttribute('aria-checked')).toBe('true')
    const inThree = new Date()
    inThree.setDate(inThree.getDate() + 3)
    expect(screen.getByRole('button', { name: `Memorise on: ${formatDay(ymd(inThree))}` })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(api.updateWord).toHaveBeenCalledWith(
        'w1',
        expect.objectContaining({ levelId: L3.id, reviewOn: ymd(inThree) }),
      ),
    )
  })
})
