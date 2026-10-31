import { beforeEach, describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { todayYmd, ymd } from '@/core/lib/format'
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
    expect((screen.getByLabelText('Memorise on') as HTMLInputElement).value).toBe(todayYmd())
    await waitFor(() => expect(api.fetchCategories).toHaveBeenCalled())
    expect(screen.queryByLabelText('Category')).toBeNull()

    fireEvent.change(screen.getByLabelText('Word'), { target: { value: 'apple' } })
    fireEvent.change(screen.getByLabelText('Translation'), { target: { value: 'olma' } })
    fireEvent.change(screen.getByLabelText('Memorise on'), { target: { value: '2026-12-01' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(api.createWord).toHaveBeenCalledWith(
        expect.objectContaining({ word: 'apple', translation: 'olma', reviewOn: '2026-12-01', categoryId: null }),
      ),
    )
  })

  test('with categories, one can be picked, optionally', async () => {
    api.fetchCategories.mockResolvedValue([category('c1', 'Travel')])
    renderForm()
    const picker = (await screen.findByLabelText('Category')) as HTMLSelectElement
    expect(picker.value).toBe('')
    fireEvent.change(picker, { target: { value: 'c1' } })
    fireEvent.change(screen.getByLabelText('Word'), { target: { value: 'ticket' } })
    fireEvent.change(screen.getByLabelText('Translation'), { target: { value: 'chipta' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(api.createWord).toHaveBeenCalledWith(expect.objectContaining({ categoryId: 'c1' })),
    )
  })

  test('a cleared date says why Save is off', async () => {
    api.fetchCategories.mockResolvedValue([])
    renderForm()
    fireEvent.change(screen.getByLabelText('Memorise on'), { target: { value: '' } })
    expect(screen.getByText('Pick a day to memorise it.')).toBeTruthy()
  })

  test('a new word starts at New, and can be given another level when adding', async () => {
    api.fetchCategories.mockResolvedValue([])
    renderForm()
    const level = (await screen.findByLabelText('Level')) as HTMLSelectElement
    await waitFor(() => expect(level.value).toBe(NEW.id))
    fireEvent.change(level, { target: { value: L3.id } })
    const inThree = new Date()
    inThree.setDate(inThree.getDate() + 3)
    expect((screen.getByLabelText('Memorise on') as HTMLInputElement).value).toBe(ymd(inThree))
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
    const level = (await screen.findByLabelText('Level')) as HTMLSelectElement
    await waitFor(() => expect(level.options.length).toBe(2))
    expect(level.value).toBe(NEW.id)
    // Level and date sit side by side in one row.
    const row = (el: HTMLElement) => el.closest('label')!.parentElement
    expect(row(level)).toBe(row(screen.getByLabelText('Memorise on')))
    fireEvent.change(level, { target: { value: L3.id } })
    const inThree = new Date()
    inThree.setDate(inThree.getDate() + 3)
    expect((screen.getByLabelText('Memorise on') as HTMLInputElement).value).toBe(ymd(inThree))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(api.updateWord).toHaveBeenCalledWith(
        'w1',
        expect.objectContaining({ levelId: L3.id, reviewOn: ymd(inThree) }),
      ),
    )
  })
})
