import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { reviewKeys, type WeekReview } from '@/modules/tasks/api/reviews'
import { ReviewQuestions } from './ReviewQuestions'
import { AUTOSAVE_MS } from './useWeekAnswers'

const api = vi.hoisted(() => ({ saveWeek: vi.fn() }))
vi.mock('@/modules/tasks/api/reviews', async (orig) => ({ ...(await orig<object>()), ...api }))

const WEEK = '2026-11-09'
const TODAY = '2026-11-14'

function renderQuestions(initial: WeekReview['answers'] = null, qc = new QueryClient()) {
  const ui = (week = WEEK) => (
    <QueryClientProvider client={qc}>
      <ReviewQuestions key={week} weekStart={week} today={TODAY} initial={initial} />
    </QueryClientProvider>
  )
  const view = render(ui())
  return { ...view, qc, rerenderWeek: (week: string) => view.rerender(ui(week)) }
}

const type = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } })
const wait = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms))

describe('ReviewQuestions', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    api.saveWeek.mockImplementation(async (input: { weekStart: string }) => ({ weekStart: input.weekStart, answers: input }))
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  test('shows what was already written', () => {
    renderQuestions({ wentWell: 'Ran 3 times', wentBadly: null, change: 'Bed by 11' })
    expect((screen.getByLabelText('What went well?') as HTMLTextAreaElement).value).toBe('Ran 3 times')
    expect((screen.getByLabelText("What didn't go well?") as HTMLTextAreaElement).value).toBe('')
    expect((screen.getByLabelText('What will I change?') as HTMLTextAreaElement).value).toBe('Bed by 11')
  })

  test('saves once, a moment after typing stops, and says so', async () => {
    const { qc } = renderQuestions()
    type('What went well?', 'G')
    type('What went well?', 'Gym')
    expect(screen.getByRole('status').textContent).toBe('Saving…')

    await wait(AUTOSAVE_MS - 1)
    expect(api.saveWeek).not.toHaveBeenCalled()
    type('What will I change?', 'Sleep')
    await wait(AUTOSAVE_MS - 1)
    expect(api.saveWeek).not.toHaveBeenCalled()

    await wait(1)
    expect(api.saveWeek).toHaveBeenCalledTimes(1)
    expect(api.saveWeek).toHaveBeenCalledWith({ weekStart: WEEK, wentWell: 'Gym', wentBadly: '', change: 'Sleep' })
    expect(screen.getByRole('status').textContent).toContain('Saved')
    // The page's week now holds what the server returned.
    expect(qc.getQueryData(reviewKeys.week(WEEK, TODAY))).toMatchObject({ answers: { wentWell: 'Gym' } })
  })

  test('leaving a field saves at once', async () => {
    renderQuestions()
    type("What didn't go well?", 'Skipped English')
    fireEvent.blur(screen.getByLabelText("What didn't go well?"))
    await wait(0)
    expect(api.saveWeek).toHaveBeenCalledWith(expect.objectContaining({ wentBadly: 'Skipped English' }))
    // The timer it replaced doesn't send it a second time.
    await wait(AUTOSAVE_MS)
    expect(api.saveWeek).toHaveBeenCalledTimes(1)
  })

  test('nothing is lost on leaving: the pending save goes out on unmount', async () => {
    const { unmount } = renderQuestions()
    type('What went well?', 'Read daily')
    unmount()
    await wait(0)
    expect(api.saveWeek).toHaveBeenCalledWith(expect.objectContaining({ weekStart: WEEK, wentWell: 'Read daily' }))
  })

  test('switching weeks saves the old week and starts the new one empty', async () => {
    const { rerenderWeek } = renderQuestions()
    type('What went well?', 'Old week')
    rerenderWeek('2026-11-02')
    await wait(0)
    expect(api.saveWeek).toHaveBeenCalledWith(expect.objectContaining({ weekStart: WEEK, wentWell: 'Old week' }))
    expect((screen.getByLabelText('What went well?') as HTMLTextAreaElement).value).toBe('')
  })

  test('no change, no request', async () => {
    renderQuestions({ wentWell: 'Same', wentBadly: null, change: null })
    fireEvent.blur(screen.getByLabelText('What went well?'))
    type('What went well?', 'Samer')
    type('What went well?', 'Same')
    await wait(AUTOSAVE_MS)
    expect(api.saveWeek).not.toHaveBeenCalled()
  })

  test('a failed save says so, keeps the text and can be retried', async () => {
    api.saveWeek.mockRejectedValueOnce(new Error('offline'))
    renderQuestions()
    type('What went well?', 'Gym')
    await wait(AUTOSAVE_MS)
    expect(screen.getByRole('status').textContent).toContain("Couldn't save")
    expect((screen.getByLabelText('What went well?') as HTMLTextAreaElement).value).toBe('Gym')

    fireEvent.click(screen.getByRole('button', { name: 'Save again' }))
    await wait(0)
    expect(api.saveWeek).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('status').textContent).toContain('Saved')
  })
})
