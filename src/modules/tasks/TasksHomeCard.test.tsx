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
  test('counts what is due and lists the first few, overdue first', () => {
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
    expect(screen.getByText('4 due today')).toBeTruthy()
    expect(screen.getByText('1 overdue')).toBeTruthy()
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Pay rent', 'Gym', 'Read'])
    expect(screen.getByRole('link').getAttribute('href')).toBe('/tasks')
  })
})
