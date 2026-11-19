import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { todayYmd } from '@/core/lib/format'
import type { Task } from '@/modules/tasks/api/tasks'
import { AllTasksPage } from './AllTasksPage'

const api = vi.hoisted(() => ({ fetchTasks: vi.fn() }))
vi.mock('@/modules/tasks/api/tasks', async (orig) => ({ ...(await orig<object>()), ...api }))

const t = (id: string, dueDate: string | null): Task => ({
  id, title: id.toUpperCase(), note: null, dueDate, dueTime: null, repeatMode: 'none', repeatUnit: null,
  repeatEvery: null, repeatWeekdays: null, repeatMonthDay: null, completedAt: null, createdAt: '', updatedAt: '',
  isHabit: false, identity: null, cue: null, stages: [], progress: null,
})

describe('AllTasksPage', () => {
  test('is only the list of tasks: no ticking, no completed section', async () => {
    api.fetchTasks.mockResolvedValue([t('a', todayYmd()), t('b', null)])
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <AllTasksPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )
    expect(await screen.findByText('A')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /^Complete / })).toBeNull()
    expect(screen.queryByRole('heading', { name: 'Completed' })).toBeNull()
    expect(api.fetchTasks).toHaveBeenCalledWith('active', todayYmd())
    expect(api.fetchTasks).not.toHaveBeenCalledWith('done', expect.anything())
  })

  test('the groups in outline, without ticks, while the tasks load', () => {
    api.fetchTasks.mockReturnValue(new Promise(() => {}))
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <AllTasksPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )
    const busy = screen.getByText('Loading…').closest('[aria-busy="true"]')
    expect(busy).toBeTruthy()
    // Not the empty state: nothing says "no tasks" before the list is known.
    expect(screen.queryByText('No tasks yet')).toBeNull()
  })
})
