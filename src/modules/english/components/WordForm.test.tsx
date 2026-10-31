import { beforeEach, describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { todayYmd } from '@/core/lib/format'
import { category } from '@/modules/english/test-data'
import { WordForm } from './WordForm'

const api = vi.hoisted(() => ({
  createWord: vi.fn(),
  updateWord: vi.fn(),
  deleteWord: vi.fn(),
  fetchCategories: vi.fn(),
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
  beforeEach(() => api.createWord.mockResolvedValue({ id: 'n' }))

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
})
