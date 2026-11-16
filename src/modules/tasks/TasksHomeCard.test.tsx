import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { todayYmd } from '@/core/lib/format'
import { tasksKeys, type Task } from '@/modules/tasks/api/tasks'
import { TasksHomeCard } from './TasksHomeCard'

const api = vi.hoisted(() => ({ fetchToday: vi.fn() }))
vi.mock('@/modules/tasks/api/tasks', async (orig) => ({ ...(await orig<object>()), ...api }))

const t = (id: string, title: string): Task => ({
  id, title, note: null, dueDate: todayYmd(), dueTime: null, repeatMode: 'none', repeatUnit: null,
  repeatEvery: null, repeatWeekdays: null, repeatMonthDay: null, completedAt: null, createdAt: '', updatedAt: '',
  isHabit: false, identity: null, cue: null, minVersion: null, stages: [], progress: null,
})

describe('TasksHomeCard', () => {
  test("lists the day's tasks with a tick for each and the progress of the day; past ones stay out", () => {
    const qc = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } })
    qc.setQueryData(tasksKeys.today(todayYmd()), {
      overdue: [t('a', 'Pay rent')],
      today: [t('b', 'Gym'), t('c', 'Read'), t('d', 'Call mum')],
      doneToday: [],
    })
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <TasksHomeCard />
        </MemoryRouter>
      </QueryClientProvider>,
    )
    expect(screen.queryByText('Pay rent')).toBeNull()
    expect(screen.getAllByRole('button', { name: /^Complete / }).map((b) => b.getAttribute('aria-label'))).toEqual([
      'Complete Gym',
      'Complete Read',
      'Complete Call mum',
    ])
    expect(screen.getByRole('progressbar', { name: '0 of 3 done today' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Open Tasks' }).getAttribute('href')).toBe('/tasks')
  })

  test("today's rows in outline while the day loads", () => {
    api.fetchToday.mockReturnValue(new Promise(() => {}))
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <TasksHomeCard />
        </MemoryRouter>
      </QueryClientProvider>,
    )
    const busy = screen.getByText('Loading…').closest('[aria-busy="true"]')
    expect(busy).toBeTruthy()
    expect(screen.queryByRole('button', { name: /^Complete / })).toBeNull()
    expect(screen.queryByText('Nothing due today')).toBeNull()
  })
})
