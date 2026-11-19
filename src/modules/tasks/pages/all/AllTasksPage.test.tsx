import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { todayYmd } from '@/core/lib/format'
import type { Task } from '@/modules/tasks/api/tasks'
import { AllTasksPage } from './AllTasksPage'

const api = vi.hoisted(() => ({ fetchTasks: vi.fn() }))
vi.mock('@/modules/tasks/api/tasks', async (orig) => ({ ...(await orig<object>()), ...api }))
const groupsApi = vi.hoisted(() => ({ fetchGroups: vi.fn().mockResolvedValue([]) }))
vi.mock('@/modules/tasks/api/groups', async (orig) => ({ ...(await orig<object>()), ...groupsApi }))

const t = (id: string, dueDate: string | null, groupId: string | null = null): Task => ({
  id, title: id.toUpperCase(), note: null, dueDate, dueTime: null, remindBefore: 15, repeatMode: 'none', repeatUnit: null,
  repeatEvery: null, repeatWeekdays: null, repeatMonthDay: null, completedAt: null, createdAt: '', updatedAt: '',
  isHabit: false, identity: null, cue: null, progress: null, groupId,
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

  test("with groups in use, the sections are the user's groups, then No group, each by due", async () => {
    groupsApi.fetchGroups.mockResolvedValueOnce([
      { id: 'g1', name: 'Ish', createdAt: '' },
      { id: 'g2', name: 'Uy', createdAt: '' },
    ])
    api.fetchTasks.mockResolvedValue([t('a', todayYmd(), 'g2'), t('b', todayYmd()), t('c', null, 'g1')])
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <AllTasksPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )
    expect(await screen.findByRole('heading', { name: 'Ish' })).toBeTruthy()
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(headings).toEqual(['Ish', 'Uy', 'No group'])
    // Not by when they're due any more.
    expect(screen.queryByRole('heading', { name: 'Today' })).toBeNull()
  })

  test('with groups in use, a task whose day passed stays in its group: no "Not done" section', async () => {
    groupsApi.fetchGroups.mockResolvedValueOnce([{ id: 'g1', name: 'Ish', createdAt: '' }])
    api.fetchTasks.mockResolvedValue([t('old', '2020-01-01', 'g1'), t('a', todayYmd(), 'g1')])
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <AllTasksPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )
    const ish = (await screen.findByRole('heading', { name: 'Ish' })).closest('section')!
    expect(ish.textContent).toContain('OLD')
    expect(screen.queryByText('Not done')).toBeNull()
  })

  test('a group with no tasks yet still shows, empty', async () => {
    groupsApi.fetchGroups.mockResolvedValueOnce([
      { id: 'g1', name: 'Ish', createdAt: '' },
      { id: 'g2', name: 'Uy', createdAt: '' },
    ])
    api.fetchTasks.mockResolvedValue([t('a', todayYmd())])
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <AllTasksPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )
    expect(await screen.findByRole('heading', { name: 'Ish' })).toBeTruthy()
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(headings).toEqual(['Ish', 'Uy', 'No group'])
  })
})
