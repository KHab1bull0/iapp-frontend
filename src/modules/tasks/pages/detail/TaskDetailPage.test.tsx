import { describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { addDaysYmd, todayYmd } from '@/core/lib/format'
import type { Task } from '@/modules/tasks/api/tasks'
import { TaskDetailPage } from './TaskDetailPage'

const api = vi.hoisted(() => ({ fetchTask: vi.fn(), fetchTaskStats: vi.fn() }))
vi.mock('@/modules/tasks/api/tasks', async (orig) => ({ ...(await orig<object>()), ...api }))

const task = (over: Partial<Task> = {}): Task => ({
  id: 'a',
  title: 'Read',
  note: 'Before bed',
  dueDate: todayYmd(),
  dueTime: '21:00',
  remindBefore: 15,
  repeatMode: 'schedule',
  repeatUnit: 'day',
  repeatEvery: 1,
  repeatWeekdays: null,
  repeatMonthDay: null,
  completedAt: null,
  createdAt: '2026-09-14T08:30:00.000Z',
  updatedAt: '',
  isHabit: true,
  identity: 'I am a reader',
  cue: null,
  progress: null,
  ...over,
})

function renderPage() {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={['/tasks/a']}>
        <Routes>
          <Route path="/tasks/:id" element={<TaskDetailPage />} />
          <Route path="/tasks/:id/edit" element={<p>edit page</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('TaskDetailPage', () => {
  test('shows the task in full and its record', async () => {
    api.fetchTask.mockResolvedValue(task())
    api.fetchTaskStats.mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Read' })).toBeTruthy()
    expect(screen.getByText('Before bed')).toBeTruthy()
    expect(screen.getByText('21:00')).toBeTruthy()
    expect(screen.getByText('Every day')).toBeTruthy()
    expect(screen.getByText('I am a reader')).toBeTruthy()
    // The day it started.
    expect(screen.getByText('Started').nextElementSibling?.textContent).toMatch(/2026/)
    expect(screen.getByRole('region', { name: 'Task statistics' })).toBeTruthy()
    expect(screen.getByText('Reminder').nextElementSibling?.textContent).toBe('15 minutes before')
  })

  test('"No reminder" is shown as such', async () => {
    api.fetchTask.mockResolvedValue(task({ remindBefore: null }))
    api.fetchTaskStats.mockReturnValue(new Promise(() => {}))
    renderPage()
    expect((await screen.findByText('Reminder')).nextElementSibling?.textContent).toBe('No reminder')
  })

  test('a task without a time has no reminder row', async () => {
    api.fetchTask.mockResolvedValue(task({ dueTime: null, remindBefore: 60 }))
    api.fetchTaskStats.mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Read' })).toBeTruthy()
    expect(screen.queryByText('Reminder')).toBeNull()
  })

  test('the calendar of days done is always there, whether the task is behind or not', async () => {
    api.fetchTask.mockResolvedValue(task({ dueDate: addDaysYmd(todayYmd(), 3) }))
    api.fetchTaskStats.mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(await screen.findByRole('region', { name: 'Days done' })).toBeTruthy()
    expect(screen.getByRole('grid')).toBeTruthy()
  })

  test('Edit opens the editor', async () => {
    api.fetchTask.mockResolvedValue(task())
    api.fetchTaskStats.mockReturnValue(new Promise(() => {}))
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Edit' }))
    // On a wide screen (the test's default) the editor is the side panel, with the form only.
    expect(await screen.findByText('Edit task')).toBeTruthy()
    expect(((await screen.findByLabelText('Title')) as HTMLTextAreaElement).value).toBe('Read')
  })

  test('says so when the task is gone', async () => {
    api.fetchTask.mockRejectedValue(new Error('404'))
    renderPage()
    expect(await screen.findByText('Task not found. It may have been deleted.')).toBeTruthy()
  })
})
