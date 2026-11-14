import { beforeEach, describe, expect, test, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ToastHost } from '@/core/components/ui/toast'
import { todayYmd } from '@/core/lib/format'
import type { CompleteResult, Task } from '@/modules/tasks/api/tasks'
import { habit, progress, task } from '@/modules/tasks/test-data'
import { TodayPage } from './TodayPage'

const api = vi.hoisted(() => ({
  fetchToday: vi.fn(),
  completeTask: vi.fn(),
  undoCompletion: vi.fn(),
  claimStage: vi.fn(),
  fetchOverallStats: vi.fn(),
}))
vi.mock('@/modules/tasks/api/tasks', async (orig) => ({ ...(await orig<object>()), ...api }))

const READ = habit('read')
const result = (over: Partial<CompleteResult> = {}): CompleteResult => ({
  task: { ...READ, progress: progress({ streak: 5, total: 22, restLeft: 3 }) },
  completionId: 'c1',
  streak: { current: 5, best: 9 },
  stageReached: null,
  ...over,
})

function renderPage() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <TodayPage />
        <ToastHost />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const today = (tasks: Task[], doneToday: { completionId: string; task: Task; kind?: 'full' | 'min' | 'rest' }[] = []) =>
  api.fetchToday.mockResolvedValue({ overdue: [], today: tasks, doneToday })

describe('TodayPage: habits', () => {
  beforeEach(() => {
    today([task('chore'), READ])
    api.completeTask.mockResolvedValue(result())
    api.undoCompletion.mockResolvedValue(READ)
    api.claimStage.mockResolvedValue({})
    api.fetchOverallStats.mockResolvedValue({ total: 0, daily: [], currentStreak: 0 })
  })

  test('habits get their own section on top, with the streak and the stage', async () => {
    renderPage()
    const habits = await screen.findByRole('heading', { name: 'Habits' })
    const todayHead = screen.getByRole('heading', { name: 'Today' })
    expect(habits.compareDocumentPosition(todayHead) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    const section = habits.closest('section')!
    expect(within(section).getByText('READ')).toBeTruthy()
    expect(within(section).queryByText('CHORE')).toBeNull()
    expect(within(section).getByText('Streak: 4 days')).toBeTruthy()
    expect(within(section).getByText('Stage 1 4/10')).toBeTruthy()
    // Not at risk: no warning.
    expect(screen.queryByText('Get back to it today')).toBeNull()
  })

  test('an at-risk habit says to get back to it today, and goes first', async () => {
    today([habit('walk'), habit('run', { progress: progress({ atRisk: true }) })])
    renderPage()
    expect(await screen.findByText('Get back to it today')).toBeTruthy()
    const ticks = screen.getAllByRole('button', { name: /^Complete / }).map((b) => b.getAttribute('aria-label'))
    expect(ticks).toEqual(['Complete RUN', 'Complete WALK'])
  })

  test('the tick is one tap in full, then the streak ticks up with the vote, and Undo still works', async () => {
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Complete READ' }))
    await waitFor(() => expect(api.completeTask).toHaveBeenCalledWith('read', todayYmd(), todayYmd(), { kind: 'full' }))

    const status = await screen.findByRole('status')
    await within(status).findByText('+1 vote: I am a reader')
    expect(within(status).getByText('“READ” done. Streak: 5 days')).toBeTruthy()
    // Not a modal, and no plain "done" toast on top of it.
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.queryByText('“READ” done')).toBeNull()

    fireEvent.click(within(status).getByRole('button', { name: 'Undo' }))
    await waitFor(() => expect(api.undoCompletion).toHaveBeenCalledWith('c1'))
  })

  test('without an identity it counts the votes instead', async () => {
    today([habit('read', { identity: null })])
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Complete READ' }))
    expect(await screen.findByText('22 times in all')).toBeTruthy()
  })

  test('"⋯" offers in full, the two-minute version and a rest day', async () => {
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'More ways to check in READ' }))
    const sheet = await screen.findByRole('dialog')
    expect(within(sheet).getByRole('button', { name: 'In full' })).toBeTruthy()
    expect(within(sheet).getByRole('button', { name: /Rest day \(3 left\)/ })).toBeTruthy()
    fireEvent.click(within(sheet).getByRole('button', { name: 'Two-minute version: Read 1 page' }))
    await waitFor(() => expect(api.completeTask).toHaveBeenCalledWith('read', todayYmd(), todayYmd(), { kind: 'min' }))
    // The two-minute version is done too: a vote.
    expect(await screen.findByText('+1 vote: I am a reader')).toBeTruthy()
  })

  test('a rest day keeps the streak quietly and says how many are left', async () => {
    api.completeTask.mockResolvedValue(result({ task: { ...READ, progress: progress({ restLeft: 2 }) }, streak: { current: 4, best: 9 } }))
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'More ways to check in READ' }))
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: /Rest day/ }))
    await waitFor(() => expect(api.completeTask).toHaveBeenCalledWith('read', todayYmd(), todayYmd(), { kind: 'rest' }))
    expect(await screen.findByText('“READ”: rest day. 2 left this month')).toBeTruthy()
    expect(screen.queryByText('+1 vote: I am a reader')).toBeNull()
  })

  test('no rest days left: the choice is off; a refused rest day says why', async () => {
    today([habit('read', { progress: progress({ restLeft: 0 }) }), habit('nap')])
    api.completeTask.mockRejectedValue({ response: { data: { message: 'errors.rest_limit' } } })
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'More ways to check in READ' }))
    const rest = within(await screen.findByRole('dialog')).getByRole('button', { name: /Rest day \(0 left\)/ })
    expect((rest as HTMLButtonElement).disabled).toBe(true)
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())

    fireEvent.click(screen.getByRole('button', { name: 'More ways to check in NAP' }))
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: /Rest day/ }))
    expect(await screen.findByText('No rest days left this month (4 a month)')).toBeTruthy()
  })

  test('a long touch opens the same choices; a short tap opens the editor as before', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      renderPage()
      const title = await screen.findByText('READ')
      fireEvent.pointerDown(title, { pointerType: 'touch', pointerId: 1, clientX: 10, clientY: 10 })
      act(() => void vi.advanceTimersByTime(600))
      fireEvent.pointerUp(title, { pointerType: 'touch', pointerId: 1 })
      fireEvent.click(title)
      const sheet = await screen.findByRole('dialog')
      expect(within(sheet).getByRole('button', { name: 'In full' })).toBeTruthy()
      // The click after the hold didn't tick it either.
      expect(api.completeTask).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  test('done habits stay in their section, ticked; a rest day reads as one', async () => {
    today([], [
      { completionId: 'c7', task: habit('read', { progress: progress({ streak: 5 }) }) },
      { completionId: 'c8', task: habit('nap'), kind: 'rest' },
    ])
    renderPage()
    const section = (await screen.findByRole('heading', { name: 'Habits' })).closest('section')!
    expect(within(section).getByText('2/2')).toBeTruthy()
    expect(within(section).getByRole('button', { name: 'Undo READ' })).toBeTruthy()
    expect(within(section).getByText('Rest day')).toBeTruthy()
    // Done habits don't also fill the Done group.
    expect(screen.queryByRole('heading', { name: /^Done/ })).toBeNull()
    expect(screen.getByText('Everything for today is done')).toBeTruthy()
  })

  test('reaching a stage: a sheet with the reward, the claim, and the next stage at once', async () => {
    api.completeTask.mockResolvedValue(
      result({
        streak: { current: 10, best: 10 },
        stageReached: { id: 'read-s1', position: 1, days: 10, reward: 'New mouse' },
        task: { ...READ, progress: progress({ streak: 10, stage: { position: 2, days: 30, reward: 'A book' } }) },
      }),
    )
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Complete READ' }))
    const sheet = await screen.findByRole('dialog', { name: 'You reached stage 1!' })
    expect(within(sheet).getByText('Your reward: New mouse')).toBeTruthy()
    expect(within(sheet).getByText('Next stage: Stage 2')).toBeTruthy()
    expect(within(sheet).getByText('10/30')).toBeTruthy()
    expect(within(sheet).getByText('Reward: A book')).toBeTruthy()
    // Instead of the small celebration, not on top of it.
    expect(screen.queryByText('+1 vote: I am a reader')).toBeNull()

    fireEvent.click(within(sheet).getByRole('button', { name: 'I took my reward' }))
    await waitFor(() => expect(api.claimStage).toHaveBeenCalledWith('read-s1', expect.anything()))
    expect(await screen.findByText('Enjoy it!')).toBeTruthy()
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  describe('the streak counts days for a daily habit, times for any other', () => {
    test('in Uzbek', async () => {
      localStorage.setItem('iapp-lang', 'uz')
      today([
        habit('read'),
        habit('gym', { repeatUnit: 'week', repeatWeekdays: [1, 3], progress: progress({ streak: 6 }) }),
      ])
      renderPage()
      expect(await screen.findByText('Ketma-ket: 4 kun')).toBeTruthy()
      expect(screen.getByText('Ketma-ket: 6 marta')).toBeTruthy()
      expect(screen.getByRole('heading', { name: 'Odatlar' })).toBeTruthy()
      expect(screen.getByText('1-bosqich 4/10')).toBeTruthy()
    })

    test('in English, every second day is not daily', async () => {
      today([habit('read', { repeatEvery: 2 })])
      renderPage()
      expect(await screen.findByText('Streak: 4 times')).toBeTruthy()
    })
  })
})
