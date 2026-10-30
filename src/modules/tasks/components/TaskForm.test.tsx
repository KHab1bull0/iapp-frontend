import { beforeEach, describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { todayYmd } from '@/core/lib/format'
import { TaskForm } from './TaskForm'

const api = vi.hoisted(() => ({ createTask: vi.fn(), updateTask: vi.fn(), deleteTask: vi.fn() }))
vi.mock('@/modules/tasks/api/tasks', async (orig) => ({ ...(await orig<object>()), ...api }))

function renderForm() {
  const onSaved = vi.fn()
  render(
    <QueryClientProvider client={new QueryClient()}>
      <TaskForm task={null} onSaved={onSaved} onCancel={() => {}} />
    </QueryClientProvider>,
  )
  return { onSaved }
}

const save = () => screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement

describe('TaskForm', () => {
  beforeEach(() => api.createTask.mockResolvedValue({ id: 'n' }))

  test('needs a title, and a new task defaults to today with no repeat', async () => {
    const { onSaved } = renderForm()
    expect(save().disabled).toBe(true)
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Call mum' } })
    fireEvent.click(save())
    await waitFor(() =>
      expect(api.createTask).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Call mum', dueDate: todayYmd(), repeatMode: 'none' }),
      ),
    )
    await waitFor(() => expect(onSaved).toHaveBeenCalled())
  })

  test('after done: every N units', async () => {
    renderForm()
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Wash the car' } })
    fireEvent.click(screen.getByRole('radio', { name: 'After done' }))
    fireEvent.change(screen.getByLabelText('Every'), { target: { value: '10' } })
    fireEvent.click(save())
    await waitFor(() =>
      expect(api.createTask).toHaveBeenCalledWith(
        expect.objectContaining({ repeatMode: 'after_done', repeatUnit: 'day', repeatEvery: 10 }),
      ),
    )
  })

  test('a weekly schedule starts with the date\'s weekday and needs at least one', async () => {
    renderForm()
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Gym' } })
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-11-02' } }) // a Monday
    fireEvent.click(screen.getByRole('radio', { name: 'Schedule' }))
    fireEvent.change(screen.getByLabelText('Unit'), { target: { value: 'week' } })
    const days = screen.getByRole('group', { name: 'Weekdays' })
    const mon = within(days).getByRole('checkbox', { name: 'Mon' })
    expect(mon.getAttribute('aria-checked')).toBe('true')
    fireEvent.click(mon)
    expect(save().disabled).toBe(true)
    fireEvent.click(within(days).getByRole('checkbox', { name: 'Mon' }))
    fireEvent.click(within(days).getByRole('checkbox', { name: 'Thu' }))
    expect(save().disabled).toBe(false)
    fireEvent.click(save())
    await waitFor(() =>
      expect(api.createTask).toHaveBeenCalledWith(
        expect.objectContaining({ repeatMode: 'schedule', repeatUnit: 'week', repeatWeekdays: [1, 4] }),
      ),
    )
  })

  test('an existing task can be deleted after confirming', async () => {
    api.deleteTask.mockResolvedValue(undefined)
    const onSaved = vi.fn()
    render(
      <QueryClientProvider client={new QueryClient()}>
        <TaskForm
          task={{
            id: 't1', title: 'Old', note: null, dueDate: null, dueTime: null, repeatMode: 'none',
            repeatUnit: null, repeatEvery: null, repeatWeekdays: null, repeatMonthDay: null, completedAt: null,
            createdAt: '', updatedAt: '',
          }}
          onSaved={onSaved}
          onCancel={() => {}}
        />
      </QueryClientProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    const dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(api.deleteTask).toHaveBeenCalledWith('t1'))
    await waitFor(() => expect(onSaved).toHaveBeenCalled())
  })
})
