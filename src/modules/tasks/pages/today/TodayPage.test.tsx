import { beforeEach, describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ToastHost } from '@/core/components/ui/toast'
import { todayYmd } from '@/core/lib/format'
import type { Task } from '@/modules/tasks/api/tasks'
import { TodayPage } from './TodayPage'

const api = vi.hoisted(() => ({
  fetchToday: vi.fn(),
  completeTask: vi.fn(),
  undoCompletion: vi.fn(),
}))
vi.mock('@/modules/tasks/api/tasks', async (orig) => ({ ...(await orig<object>()), ...api }))

const t = (id: string, over: Partial<Task> = {}): Task => ({
  id,
  title: id.toUpperCase(),
  note: null,
  dueDate: todayYmd(),
  dueTime: null,
  repeatMode: 'none',
  repeatUnit: null,
  repeatEvery: null,
  repeatWeekdays: null,
  repeatMonthDay: null,
  completedAt: null,
  createdAt: '',
  updatedAt: '',
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

describe('TodayPage', () => {
  beforeEach(() => {
    api.fetchToday.mockResolvedValue({
      overdue: [t('a', { dueDate: '2026-01-01', repeatMode: 'schedule', repeatUnit: 'day', repeatEvery: 1 })],
      today: [t('b', { dueTime: '09:30' })],
      doneToday: [{ completionId: 'c0', task: t('c') }],
    })
    api.completeTask.mockResolvedValue({ task: t('b'), completionId: 'c1' })
    api.undoCompletion.mockResolvedValue(t('b'))
  })

  test('shows overdue first, then today, with done tasks tucked away', async () => {
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Overdue' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Today' })).toBeTruthy()
    expect(screen.getByText('A')).toBeTruthy()
    expect(screen.getByText('Every day')).toBeTruthy()
    expect(screen.getByText('09:30')).toBeTruthy()
    // Done is its own group, always shown, not folded away.
    expect(screen.getByRole('heading', { name: 'Done' })).toBeTruthy()
    expect(screen.getByText('C')).toBeTruthy()
  })

  test('ticking a task completes it for today, and Undo puts it back', async () => {
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Complete B' }))
    await waitFor(() => expect(api.completeTask).toHaveBeenCalledWith('b', todayYmd(), todayYmd()))
    fireEvent.click(await screen.findByRole('button', { name: 'Undo' }))
    await waitFor(() => expect(api.undoCompletion).toHaveBeenCalledWith('c1'))
  })

  test('says so when nothing is due', async () => {
    api.fetchToday.mockResolvedValue({ overdue: [], today: [], doneToday: [] })
    renderPage()
    expect(await screen.findByText('Nothing due today')).toBeTruthy()
  })

  test('a task can be ticked only once while the request is in flight', async () => {
    api.completeTask.mockReturnValue(new Promise(() => {}))
    renderPage()
    const tick = (await screen.findByRole('button', { name: 'Complete B' })) as HTMLButtonElement
    fireEvent.click(tick)
    await waitFor(() => expect(tick.disabled).toBe(true))
    fireEvent.click(tick)
    expect(api.completeTask).toHaveBeenCalledTimes(1)
  })

  test('tasks with a time come first, earliest at the top', async () => {
    api.fetchToday.mockResolvedValue({
      overdue: [],
      today: [t('u'), t('b', { dueTime: '09:30' }), t('e', { dueTime: '07:00' })],
      doneToday: [],
    })
    renderPage()
    await screen.findByText('U')
    const titles = screen.getAllByRole('button', { name: /^Complete / }).map((b) => b.getAttribute('aria-label'))
    expect(titles).toEqual(['Complete E', 'Complete B', 'Complete U'])
  })

  test('reads Uzbek when Uzbek is chosen', async () => {
    localStorage.setItem('iapp-lang', 'uz')
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Kechikkan' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Bugun' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Bajarilgan' })).toBeTruthy()
    expect(screen.getByText('Har kuni')).toBeTruthy()
  })
})
