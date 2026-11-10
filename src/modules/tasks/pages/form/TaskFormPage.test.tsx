import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { addDaysYmd, todayYmd } from '@/core/lib/format'
import type { Task } from '@/modules/tasks/api/tasks'
import { TaskFormPage } from './TaskFormPage'

const api = vi.hoisted(() => ({ fetchTask: vi.fn(), fetchTaskStats: vi.fn() }))
vi.mock('@/modules/tasks/api/tasks', async (orig) => ({ ...(await orig<object>()), ...api }))

const task = (dueDate: string): Task => ({
  id: 'a',
  title: 'Read',
  note: null,
  dueDate,
  dueTime: null,
  repeatMode: 'schedule',
  repeatUnit: 'day',
  repeatEvery: 1,
  repeatWeekdays: null,
  repeatMonthDay: null,
  completedAt: null,
  createdAt: '',
  updatedAt: '',
})

function renderPage() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={['/tasks/a/edit']}>
        <Routes>
          <Route path="/tasks/:id/edit" element={<TaskFormPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

// Phones edit a task on this page, not in the desktop panel: the past-day tick must be here too.
describe('TaskFormPage', () => {
  test('an overdue task offers to mark a past day done', async () => {
    api.fetchTask.mockResolvedValue(task(addDaysYmd(todayYmd(), -2)))
    api.fetchTaskStats.mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(await screen.findByRole('button', { name: /Mark a past day done/ })).toBeTruthy()
  })

  test('a task due today does not', async () => {
    api.fetchTask.mockResolvedValue(task(todayYmd()))
    api.fetchTaskStats.mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(await screen.findByText('Edit task')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Mark a past day done/ })).toBeNull()
  })
})
