import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { todayYmd } from '@/core/lib/format'
import { tasksKeys, type Task } from '@/modules/tasks/api/tasks'
import { TasksHomeCard } from './TasksHomeCard'

const t = (id: string, title: string): Task => ({
  id, title, note: null, dueDate: todayYmd(), dueTime: null, repeatMode: 'none', repeatUnit: null,
  repeatEvery: null, repeatWeekdays: null, repeatMonthDay: null, completedAt: null, createdAt: '', updatedAt: '',
})

describe('TasksHomeCard', () => {
  test('lists what is due, overdue first, with a tick for each and the progress of the day', () => {
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
    expect(screen.getByText('1 overdue')).toBeTruthy()
    expect(screen.getAllByRole('button', { name: /^Complete / }).map((b) => b.getAttribute('aria-label'))).toEqual([
      'Complete Pay rent',
      'Complete Gym',
      'Complete Read',
      'Complete Call mum',
    ])
    expect(screen.getByRole('progressbar', { name: '0 of 4 done today' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Open Tasks' }).getAttribute('href')).toBe('/tasks')
  })
})
