import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { addDaysYmd, todayYmd } from '@/core/lib/format'
import type { ReviewListItem, WeekReview } from '@/modules/tasks/api/reviews'
import { mondayOf, weekRange } from '@/modules/tasks/review/week'
import { ReviewPage } from './ReviewPage'

const api = vi.hoisted(() => ({ fetchWeek: vi.fn(), saveWeek: vi.fn(), fetchReviews: vi.fn() }))
vi.mock('@/modules/tasks/api/reviews', async (orig) => ({ ...(await orig<object>()), ...api }))

const today = todayYmd()
const current = mondayOf(today)
const prev = addDaysYmd(current, -7)
const older = addDaysYmd(current, -14)

const week = (weekStart: string, over: Partial<WeekReview> = {}): WeekReview => ({
  weekStart,
  weekEnd: addDaysYmd(weekStart, 6),
  tasks: { done: 9, due: 12, rate: 75, missed: 2 },
  habits: [{ taskId: 't1', title: 'Read', done: 5, due: 7 }],
  answers: null,
  ...over,
})

const LIST: ReviewListItem[] = [
  { weekStart: current, rate: 75, answered: false },
  { weekStart: prev, rate: 60, answered: true },
  { weekStart: older, rate: 90, answered: false },
]

function Where() {
  return <output data-testid="where">{useLocation().search}</output>
}

function renderPage(entry = '/tasks/review') {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route
            path="/tasks/review"
            element={
              <>
                <ReviewPage />
                <Where />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const where = () => screen.getByTestId('where').textContent

describe('ReviewPage', () => {
  beforeEach(() => {
    api.fetchWeek.mockImplementation(async (weekStart: string) => week(weekStart))
    api.fetchReviews.mockResolvedValue(LIST)
    api.saveWeek.mockImplementation(async (input: { weekStart: string }) => week(input.weekStart))
  })
  afterEach(() => vi.clearAllMocks())

  test("this week's summary: the rate ring, counts and habits, nothing else", async () => {
    renderPage()
    expect(await screen.findByRole('progressbar', { name: 'Done: 75%' })).toBeTruthy()
    expect(api.fetchWeek).toHaveBeenCalledWith(current, today)
    expect(screen.getByText('9 of 12 done')).toBeTruthy()

    const tasks = screen.getByRole('region', { name: 'Tasks' })
    expect(within(tasks).getByText('Missed').nextSibling?.textContent).toBe('2')
    expect(within(tasks).queryByText('Rest')).toBeNull()

    const habits = screen.getByRole('region', { name: 'Habits' })
    expect(within(habits).getByText('Read')).toBeTruthy()
    expect(within(habits).getByText('5 of 7 done')).toBeTruthy()
    expect(within(habits).queryByText(/Streak/)).toBeNull()

    // English and money have their own pages.
    expect(screen.queryByRole('region', { name: 'English' })).toBeNull()
    expect(screen.queryByRole('region', { name: 'Finance' })).toBeNull()
  })

  test('steps back a week and forward again, never past this week', async () => {
    renderPage()
    const next = await screen.findByRole('button', { name: 'Next week' })
    expect((next as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByText(weekRange(current))).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Previous week' }))
    expect(where()).toBe(`?week=${prev}`)
    await waitFor(() => expect(api.fetchWeek).toHaveBeenCalledWith(prev, today))
    // The stepper names it (the past weeks list, which stays on screen, does too).
    expect(within(screen.getByRole('group', { name: 'Week' })).getByText(weekRange(prev))).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Next week' }))
    // Back on this week: the plain URL.
    expect(where()).toBe('')
    expect((screen.getByRole('button', { name: 'Next week' }) as HTMLButtonElement).disabled).toBe(true)
  })

  test('a week still to come opens this one', async () => {
    renderPage(`/tasks/review?week=${addDaysYmd(current, 14)}`)
    await screen.findByRole('progressbar', { name: 'Done: 75%' })
    expect(api.fetchWeek).toHaveBeenCalledWith(current, today)
    expect(api.fetchWeek).not.toHaveBeenCalledWith(addDaysYmd(current, 14), today)
  })

  test('past weeks: rate and answered badge, and each opens its week', async () => {
    renderPage()
    const past = await screen.findByRole('region', { name: 'Past weeks' })
    const rows = await within(past).findAllByRole('link')
    // The current week is the page itself, not a "past" one.
    expect(rows).toHaveLength(2)
    expect(rows[0].textContent).toContain('60%')
    expect(within(rows[0]).getByText('Answered')).toBeTruthy()
    expect(within(rows[1]).getByText('Not answered')).toBeTruthy()

    fireEvent.click(rows[1])
    expect(where()).toBe(`?week=${older}`)
    await waitFor(() => expect(api.fetchWeek).toHaveBeenCalledWith(older, today))
    const reopened = await screen.findByRole('region', { name: 'Past weeks' })
    expect((await within(reopened).findAllByRole('link'))[1].getAttribute('aria-current')).toBe('page')
  })

  test('opens a past week with its answers', async () => {
    api.fetchWeek.mockImplementation(async (weekStart: string) =>
      week(weekStart, { answers: { wentWell: 'Ran every day', wentBadly: null, change: null } }),
    )
    renderPage(`/tasks/review?week=${prev}`)
    const field = (await screen.findByLabelText('What went well?')) as HTMLTextAreaElement
    expect(field.value).toBe('Ran every day')
    expect(api.fetchWeek).toHaveBeenCalledWith(prev, today)
  })

  test('typing saves to the week on screen', async () => {
    renderPage(`/tasks/review?week=${prev}`)
    fireEvent.change(await screen.findByLabelText('What will I change?'), { target: { value: 'Phone out of the bedroom' } })
    fireEvent.blur(screen.getByLabelText('What will I change?'))
    await waitFor(() =>
      expect(api.saveWeek).toHaveBeenCalledWith(
        expect.objectContaining({ weekStart: prev, change: 'Phone out of the bedroom' }),
      ),
    )
  })

  test('empty states: no tasks due, no habits, no past weeks', async () => {
    api.fetchWeek.mockImplementation(async (weekStart: string) =>
      week(weekStart, { tasks: { done: 0, due: 0, rate: 0, missed: 0 }, habits: [] }),
    )
    api.fetchReviews.mockResolvedValue([{ weekStart: current, rate: 0, answered: false }])
    renderPage()
    expect(await screen.findByText('No tasks this week')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Add a task' })).toBeTruthy()
    expect(screen.getByText('No habits yet')).toBeTruthy()
    expect(await screen.findByText('No past weeks yet')).toBeTruthy()
  })

  test('first load: the page in outline under its heading and stepper', () => {
    api.fetchWeek.mockReturnValue(new Promise(() => {}))
    api.fetchReviews.mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByText('Loading the week…').closest('[aria-busy="true"]')).toBeTruthy()
    expect(screen.queryByLabelText('What went well?')).toBeNull()
    expect(screen.getByRole('button', { name: 'Previous week' })).toBeTruthy()
    const past = screen.getByRole('region', { name: 'Past weeks' })
    expect(past.getAttribute('aria-busy')).toBe('true')
    expect(within(past).getByText('Loading past weeks…')).toBeTruthy()
  })

  test('stepping keeps the week on screen, quieter and out of reach, until the next one lands', async () => {
    renderPage()
    await screen.findByRole('progressbar', { name: 'Done: 75%' })
    let resolve!: (w: WeekReview) => void
    api.fetchWeek.mockImplementationOnce(() => new Promise((r) => (resolve = r)))
    fireEvent.click(screen.getByRole('button', { name: 'Previous week' }))

    // The week before, not outlines: its numbers and questions stay, inert, while the next loads.
    const busy = (await screen.findByText('Loading the week…')).closest('[aria-busy="true"]')
    expect(busy).toBeTruthy()
    expect(screen.getByRole('progressbar', { name: 'Done: 75%' })).toBeTruthy()
    expect(screen.getByLabelText('What went well?').closest('[inert]')).toBeTruthy()

    resolve(week(prev, { tasks: { done: 3, due: 6, rate: 50, missed: 3 } }))
    expect(await screen.findByRole('progressbar', { name: 'Done: 50%' })).toBeTruthy()
    expect(screen.queryByText('Loading the week…')).toBeNull()
    expect(screen.getByLabelText('What went well?').closest('[inert]')).toBeNull()
  })

  test('a failed load offers a retry', async () => {
    api.fetchWeek.mockRejectedValueOnce(new Error('offline'))
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Retry' }))
    expect(await screen.findByRole('progressbar', { name: 'Done: 75%' })).toBeTruthy()
  })

  test('speaks Uzbek', async () => {
    localStorage.setItem('iapp-lang', 'uz')
    renderPage()
    expect(await screen.findByLabelText("Nima yaxshi bo'ldi?")).toBeTruthy()
    expect(screen.getByRole('heading', { level: 1, name: 'Haftalik xulosa' })).toBeTruthy()
    expect(screen.getByLabelText("Nima bo'lmadi?")).toBeTruthy()
    expect(screen.getByLabelText("Nimani o'zgartiraman?")).toBeTruthy()
  })
})
