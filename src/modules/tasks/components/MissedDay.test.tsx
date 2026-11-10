import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastHost } from '@/core/components/ui/toast'
import type { Task } from '@/modules/tasks/api/tasks'
import { MissedDay } from './MissedDay'

const api = vi.hoisted(() => ({ completeTask: vi.fn(), undoCompletion: vi.fn() }))
vi.mock('@/modules/tasks/api/tasks', async (orig) => ({ ...(await orig<object>()), ...api }))

const task = (over: Partial<Task> = {}): Task => ({
  id: 'a',
  title: 'Read',
  note: null,
  // Not ticked on the 4th, 5th or 6th.
  dueDate: '2026-11-04',
  dueTime: null,
  repeatMode: 'schedule',
  repeatUnit: 'day',
  repeatEvery: 1,
  repeatWeekdays: null,
  repeatMonthDay: null,
  completedAt: null,
  createdAt: '',
  updatedAt: '',
  ...over,
})

function renderIt(t: Task) {
  const onDone = vi.fn()
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MissedDay task={t} onDone={onDone} />
      <ToastHost />
    </QueryClientProvider>,
  )
  return { onDone }
}

describe('MissedDay', () => {
  beforeEach(() => {
    // Two minutes past midnight on the 7th.
    vi.useFakeTimers({ now: new Date('2026-11-07T00:02:00'), toFake: ['Date'] })
    api.completeTask.mockResolvedValue({ task: task({ dueDate: '2026-11-07' }), completionId: 'c1' })
  })
  afterEach(() => vi.useRealTimers())

  test('ticks off the day picked, leaving the days before it not done', async () => {
    const { onDone } = renderIt(task())
    fireEvent.click(screen.getByRole('button', { name: /Mark a past day done/ }))
    const day = (name: RegExp) => screen.getByRole('gridcell', { name }) as HTMLButtonElement
    // From the first day not ticked up to yesterday; not today.
    expect(day(/\D4\sNovember/).disabled).toBe(false)
    expect(day(/\D3\sNovember/).disabled).toBe(true)
    expect(day(/\D7\sNovember/).disabled).toBe(true)
    fireEvent.click(day(/\D6\sNovember/))
    await waitFor(() => expect(api.completeTask).toHaveBeenCalledWith('a', '2026-11-07', '2026-11-04', '2026-11-06'))
    await waitFor(() => expect(onDone).toHaveBeenCalled())
  })

  test('yesterday is one tap', async () => {
    renderIt(task())
    fireEvent.click(screen.getByRole('button', { name: /Mark a past day done/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Yesterday' }))
    await waitFor(() => expect(api.completeTask).toHaveBeenCalledWith('a', '2026-11-07', '2026-11-04', '2026-11-06'))
  })

  test('is not offered for a task that is not behind', () => {
    renderIt(task({ dueDate: '2026-11-07' }))
    expect(screen.queryByRole('button', { name: /Mark a past day done/ })).toBeNull()
  })
})
