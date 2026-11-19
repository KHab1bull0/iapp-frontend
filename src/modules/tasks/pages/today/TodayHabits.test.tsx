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
  fetchOverallStats: vi.fn(),
}))
vi.mock('@/modules/tasks/api/tasks', async (orig) => ({ ...(await orig<object>()), ...api }))

const READ = habit('read')
const result = (over: Partial<CompleteResult> = {}): CompleteResult => ({
  task: { ...READ, progress: progress({ streak: 5, total: 22 }) },
  completionId: 'c1',
  streak: { current: 5, best: 9 },
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

const today = (tasks: Task[], doneToday: { completionId: string; task: Task }[] = []) =>
  api.fetchToday.mockResolvedValue({ overdue: [], today: tasks, doneToday })

describe('TodayPage: habits', () => {
  beforeEach(() => {
    today([task('chore'), READ])
    api.completeTask.mockResolvedValue(result())
    api.undoCompletion.mockResolvedValue(READ)
    api.fetchOverallStats.mockResolvedValue({ total: 0, daily: [], currentStreak: 0 })
  })

  test('habits sit in the Today list with the other tasks, marked with a chip and their streak', async () => {
    renderPage()
    const todayHead = await screen.findByRole('heading', { name: 'Today' })
    expect(screen.queryByRole('heading', { name: 'Habits' })).toBeNull()
    const section = todayHead.closest('section')!
    expect(within(section).getByText('READ')).toBeTruthy()
    expect(within(section).getByText('CHORE')).toBeTruthy()
    // Only the habit has the chip.
    expect(within(section).getAllByText('Habit')).toHaveLength(1)
    expect(within(section).getByText('Streak: 4 days')).toBeTruthy()
    // Not at risk: no warning.
    expect(screen.queryByText('Get back to it today')).toBeNull()
  })

  test('an at-risk habit says to get back to it today', async () => {
    today([habit('walk'), habit('run', { progress: progress({ atRisk: true }) })])
    renderPage()
    expect(await screen.findByText('Get back to it today')).toBeTruthy()
  })

  test('the tick is one tap in full, then the streak ticks up with the vote, and Undo still works', async () => {
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Complete READ' }))
    await waitFor(() => expect(api.completeTask).toHaveBeenCalledWith('read', todayYmd(), todayYmd()))

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


  test('a short tap on the title opens the editor; a long touch does nothing special', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      renderPage()
      const title = await screen.findByText('READ')
      fireEvent.pointerDown(title, { pointerType: 'touch', pointerId: 1, clientX: 10, clientY: 10 })
      act(() => void vi.advanceTimersByTime(600))
      fireEvent.pointerUp(title, { pointerType: 'touch', pointerId: 1 })
      expect(screen.queryByRole('dialog')).toBeNull()
      expect(api.completeTask).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  test('done habits go to Done with the other tasks, ticked', async () => {
    today([], [
      { completionId: 'c7', task: habit('read', { progress: progress({ streak: 5 }) }) },
      { completionId: 'c8', task: habit('nap') },
    ])
    renderPage()
    const section = (await screen.findByRole('heading', { name: /^Done/ })).closest('section')!
    expect(within(section).getByRole('button', { name: 'Undo READ' })).toBeTruthy()
    expect(within(section).getByRole('button', { name: 'Undo NAP' })).toBeTruthy()
    expect(screen.getByText('Everything for today is done')).toBeTruthy()
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
      expect(screen.getAllByText('Odat')).toHaveLength(2)
    })

    test('in English, every second day is not daily', async () => {
      today([habit('read', { repeatEvery: 2 })])
      renderPage()
      expect(await screen.findByText('Streak: 4 times')).toBeTruthy()
    })
  })
})
