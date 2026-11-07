import { beforeEach, describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { addDaysYmd, formatDay, todayYmd, ymd } from '@/core/lib/format'
import { L3, NEW, group, tag, word } from '@/modules/english/test-data'
import { WordForm } from './WordForm'

const api = vi.hoisted(() => ({
  createWord: vi.fn(),
  updateWord: vi.fn(),
  deleteWord: vi.fn(),
  fetchTags: vi.fn(),
  fetchGroups: vi.fn(),
  createTag: vi.fn(),
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
    api.fetchTags.mockResolvedValue([])
    api.fetchGroups.mockResolvedValue([])
  })

  test('a new word is due today unless another day is picked, and has no tags unless given some', async () => {
    api.fetchTags.mockResolvedValue([])
    renderForm()
    expect(screen.getByRole('button', { name: 'Memorise on: Today' })).toBeTruthy()
    await waitFor(() => expect(api.fetchTags).toHaveBeenCalled())

    fireEvent.change(screen.getByLabelText('Word'), { target: { value: 'apple' } })
    fireEvent.change(screen.getByLabelText('Translation'), { target: { value: 'olma' } })
    fireEvent.click(screen.getByRole('button', { name: 'Memorise on: Today' }))
    fireEvent.click(screen.getByRole('button', { name: 'Tomorrow' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(api.createWord).toHaveBeenCalledWith(
        expect.objectContaining({ word: 'apple', translation: 'olma', reviewOn: addDaysYmd(todayYmd(), 1), tagIds: [] }),
      ),
    )
  })

  test('tags are chips by group; any number can be on', async () => {
    api.fetchTags.mockResolvedValue([tag('t1', 'family'), tag('t2', 'noun', { groupId: 'g1' }), tag('t3', 'verb', { groupId: 'g1' })])
    api.fetchGroups.mockResolvedValue([group('g1', 'Parts of speech')])
    renderForm()
    const tags = await screen.findByRole('group', { name: 'Tags' })
    await within(tags).findByRole('button', { name: 'noun' })
    // Parts of speech first (a group), then the ungrouped.
    expect(within(tags).getByText('Parts of speech')).toBeTruthy()
    expect(within(tags).getByText('Ungrouped')).toBeTruthy()
    fireEvent.click(within(tags).getByRole('button', { name: 'noun' }))
    fireEvent.click(within(tags).getByRole('button', { name: 'family' }))
    expect(within(tags).getByRole('button', { name: 'noun' }).getAttribute('aria-pressed')).toBe('true')
    fireEvent.change(screen.getByLabelText('Word'), { target: { value: 'mother' } })
    fireEvent.change(screen.getByLabelText('Translation'), { target: { value: 'ona' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(api.createWord).toHaveBeenCalledWith(expect.objectContaining({ tagIds: ['t2', 't1'] })))
  })

  test('a new tag is made in place and turned on; Enter does not save the word', async () => {
    api.createTag.mockResolvedValue(tag('t9', 'kitchen'))
    renderForm()
    fireEvent.click(await screen.findByRole('button', { name: 'Add tag' }))
    const input = screen.getByLabelText('New tag')
    fireEvent.change(input, { target: { value: 'kitchen' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => expect(api.createTag).toHaveBeenCalledWith({ name: 'kitchen' }))
    expect(api.createWord).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText('Word'), { target: { value: 'spoon' } })
    fireEvent.change(screen.getByLabelText('Translation'), { target: { value: 'qoshiq' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(api.createWord).toHaveBeenCalledWith(expect.objectContaining({ tagIds: ['t9'] })))
  })

  test('a new word starts at New, and can be given another level when adding', async () => {
    api.fetchTags.mockResolvedValue([])
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
    api.fetchTags.mockResolvedValue([])
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
