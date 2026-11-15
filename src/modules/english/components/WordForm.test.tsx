import { beforeEach, describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { addDaysYmd, formatDay, todayYmd, ymd } from '@/core/lib/format'
import { L3, NEW, group, tag, word } from '@/modules/english/test-data'
import { loadingRegion, pending } from '@/modules/english/test-loading'
import { WordForm } from './WordForm'

const api = vi.hoisted(() => ({
  createWord: vi.fn(),
  updateWord: vi.fn(),
  deleteWord: vi.fn(),
  fetchTags: vi.fn(),
  fetchGroups: vi.fn(),
  createTag: vi.fn(),
  fetchLevels: vi.fn(),
  fetchEnglishSettings: vi.fn(),
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
    api.fetchEnglishSettings.mockResolvedValue({ newPerDay: 20 })
  })

  test('a new word is not learned yet: it joins the queue, with no level, no day and no tags unless given', async () => {
    renderForm()
    const levels = await screen.findByRole('radiogroup', { name: 'Level' })
    expect(within(levels).getByRole('radio', { name: 'Not learned' }).getAttribute('aria-checked')).toBe('true')
    // No day to pick while it waits in the queue.
    expect(screen.queryByRole('button', { name: /^Memorise on/ })).toBeNull()
    expect(await screen.findByText('It joins the queue: 20 new words come into review each day.')).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Word'), { target: { value: 'apple' } })
    fireEvent.change(screen.getByLabelText('Translation'), { target: { value: 'olma' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(api.createWord).toHaveBeenCalled())
    const input = api.createWord.mock.calls[0][0] as Record<string, unknown>
    expect(input).toMatchObject({ word: 'apple', translation: 'olma', tagIds: [] })
    expect('levelId' in input || 'reviewOn' in input).toBe(false)
  })

  test('given a level, a new word is scheduled: its day follows the level and can be moved', async () => {
    renderForm()
    const levels = await screen.findByRole('radiogroup', { name: 'Level' })
    fireEvent.click(await within(levels).findByRole('radio', { name: 'New' }))
    fireEvent.click(screen.getByRole('button', { name: 'Memorise on: Today' }))
    fireEvent.click(screen.getByRole('button', { name: 'Tomorrow' }))
    fireEvent.change(screen.getByLabelText('Word'), { target: { value: 'pear' } })
    fireEvent.change(screen.getByLabelText('Translation'), { target: { value: 'nok' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(api.createWord).toHaveBeenCalledWith(
        expect.objectContaining({ levelId: NEW.id, reviewOn: addDaysYmd(todayYmd(), 1) }),
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

  test('a level with days schedules the word that many days ahead', async () => {
    renderForm()
    const levels = await screen.findByRole('radiogroup', { name: 'Level' })
    fireEvent.click(await within(levels).findByRole('radio', { name: 'Three days, 3 days' }))
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
    await waitFor(() => expect(within(levels).getAllByRole('radio')).toHaveLength(3))
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

  test('editing can send a word back to the queue of words not learned yet', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <WordForm word={word('w2', { levelId: L3.id, reviewOn: '2099-01-01' })} onSaved={() => {}} onCancel={() => {}} />
      </QueryClientProvider>,
    )
    const levels = await screen.findByRole('radiogroup', { name: 'Level' })
    fireEvent.click(await within(levels).findByRole('radio', { name: 'Not learned' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(api.updateWord).toHaveBeenCalledWith('w2', expect.objectContaining({ levelId: null })))
  })

  test('levels and tags load as chip placeholders under their labels', () => {
    api.fetchLevels.mockReturnValue(pending())
    api.fetchTags.mockReturnValue(pending())
    renderForm()
    expect(screen.getByText('Level')).toBeTruthy()
    expect(screen.queryByRole('radiogroup', { name: 'Level' })).toBeNull()
    expect(loadingRegion()).toBeTruthy()
    const tags = screen.getByRole('group', { name: 'Tags' })
    expect(loadingRegion('Loading…', tags)).toBeTruthy()
  })

  test('saving: the button says so and is disabled, and so is Cancel; one request only', async () => {
    api.createWord.mockReturnValue(pending())
    renderForm()
    await screen.findByRole('radiogroup', { name: 'Level' })
    fireEvent.change(screen.getByLabelText('Word'), { target: { value: 'apple' } })
    fireEvent.change(screen.getByLabelText('Translation'), { target: { value: 'olma' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    const busy = await screen.findByRole('button', { name: 'Saving…' })
    expect((busy as HTMLButtonElement).disabled).toBe(true)
    expect(busy.getAttribute('aria-busy')).toBe('true')
    expect((screen.getByRole('button', { name: 'Cancel' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.submit(busy.closest('form')!)
    expect(api.createWord).toHaveBeenCalledTimes(1)
  })

  test('deleting: the button says so and the form cannot be saved meanwhile', async () => {
    api.deleteWord.mockReturnValue(pending())
    render(
      <QueryClientProvider client={new QueryClient()}>
        <WordForm word={word('w1')} onSaved={() => {}} onCancel={() => {}} />
      </QueryClientProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }))
    const busy = await screen.findByRole('button', { name: 'Deleting…' })
    expect((busy as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(true)
  })

  test('a new tag on its way: its field is busy, with a ring', async () => {
    api.createTag.mockReturnValue(pending())
    renderForm()
    fireEvent.click(await screen.findByRole('button', { name: 'Add tag' }))
    const input = screen.getByLabelText('New tag')
    fireEvent.change(input, { target: { value: 'kitchen' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect((await screen.findByRole('status')).textContent).toBe('Adding…')
    expect((input as HTMLInputElement).disabled).toBe(true)
  })
})
