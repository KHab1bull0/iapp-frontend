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
    expect(screen.getByRole('button', { name: /Done today \(1\)/ })).toBeTruthy()
  })

  test('ticking a task completes it for today, and Undo puts it back', async () => {
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Complete B' }))
    await waitFor(() => expect(api.completeTask).toHaveBeenCalledWith('b', todayYmd()))
    fireEvent.click(await screen.findByRole('button', { name: 'Undo' }))
    await waitFor(() => expect(api.undoCompletion).toHaveBeenCalledWith('c1'))
  })

  test('says so when nothing is due', async () => {
    api.fetchToday.mockResolvedValue({ overdue: [], today: [], doneToday: [] })
    renderPage()
    expect(await screen.findByText('Nothing due today')).toBeTruthy()
  })
})
