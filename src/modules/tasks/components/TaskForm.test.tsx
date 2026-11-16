import { beforeEach, describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { todayYmd } from '@/core/lib/format'
import { habit } from '@/modules/tasks/test-data'
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
  // A block, not an arrow's value: a function returned from beforeEach runs as its teardown.
  beforeEach(() => {
    api.createTask.mockResolvedValue({ id: 'n' })
  })

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

  test('title and note are one-row textareas; the title keeps to one line and Enter saves', async () => {
    renderForm()
    const title = screen.getByLabelText('Title') as HTMLTextAreaElement
    const note = screen.getByLabelText('Note') as HTMLTextAreaElement
    expect(title.tagName).toBe('TEXTAREA')
    expect(title.rows).toBe(1)
    expect(note.tagName).toBe('TEXTAREA')
    expect(note.rows).toBe(1)
    // Pasted line breaks become spaces.
    fireEvent.change(title, { target: { value: 'Call\nmum' } })
    expect(title.value).toBe('Call mum')
    // Enter saves instead of adding a line; Shift+Enter is left alone.
    fireEvent.keyDown(title, { key: 'Enter' })
    await waitFor(() =>
      expect(api.createTask).toHaveBeenCalledWith(expect.objectContaining({ title: 'Call mum' })),
    )
  })

  test('repeat is one row of dropdowns: every N and the unit only when it repeats', () => {
    renderForm()
    const kind = screen.getByLabelText('Kind') as HTMLSelectElement
    expect(kind.tagName).toBe('SELECT')
    expect(screen.queryByLabelText('Every')).toBeNull()
    expect(screen.queryByLabelText('Unit')).toBeNull()
    fireEvent.change(kind, { target: { value: 'schedule' } })
    const unit = screen.getByLabelText('Unit') as HTMLSelectElement
    expect(unit.tagName).toBe('SELECT')
    // All three side by side in the same row.
    expect(unit.parentElement).toBe(kind.parentElement)
    expect(screen.getByLabelText('Every').parentElement).toBe(kind.parentElement)
  })

  test('saving says so and goes out once, however often Save is pressed', async () => {
    api.createTask.mockReturnValue(new Promise(() => {}))
    renderForm()
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Call mum' } })
    fireEvent.click(save())
    const saving = (await screen.findByRole('button', { name: 'Saving…' })) as HTMLButtonElement
    expect(saving.disabled).toBe(true)
    expect(saving.getAttribute('aria-busy')).toBe('true')
    fireEvent.submit(saving.closest('form')!)
    expect(api.createTask).toHaveBeenCalledTimes(1)
  })

  test('after done: every N units', async () => {
    renderForm()
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Wash the car' } })
    fireEvent.change(screen.getByLabelText('Kind'), { target: { value: 'after_done' } })
    fireEvent.change(screen.getByLabelText('Every'), { target: { value: '10' } })
    fireEvent.click(save())
    await waitFor(() =>
      expect(api.createTask).toHaveBeenCalledWith(
        expect.objectContaining({ repeatMode: 'after_done', repeatUnit: 'day', repeatEvery: 10 }),
      ),
    )
  })

  test('a weekly schedule starts with the date\'s weekday and needs at least one', async () => {
    const NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const wd = tomorrow.getDay()
    const other = (wd + 3) % 7

    renderForm()
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Gym' } })
    // The date is our own picker: open it and take Tomorrow.
    fireEvent.click(screen.getByRole('button', { name: 'Date: Today' }))
    fireEvent.click(screen.getByRole('button', { name: 'Tomorrow' }))
    expect(screen.getByRole('button', { name: 'Date: Tomorrow' })).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Kind'), { target: { value: 'schedule' } })
    fireEvent.change(screen.getByLabelText('Unit'), { target: { value: 'week' } })
    const days = screen.getByRole('group', { name: 'Weekdays' })
    const start = within(days).getByRole('checkbox', { name: NAMES[wd] })
    expect(start.getAttribute('aria-checked')).toBe('true')
    fireEvent.click(start)
    expect(save().disabled).toBe(true)
    fireEvent.click(within(days).getByRole('checkbox', { name: NAMES[wd] }))
    fireEvent.click(within(days).getByRole('checkbox', { name: NAMES[other] }))
    expect(save().disabled).toBe(false)
    fireEvent.click(save())
    await waitFor(() =>
      expect(api.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          repeatMode: 'schedule',
          repeatUnit: 'week',
          repeatWeekdays: [wd, other].sort((a, b) => a - b),
        }),
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
  isHabit: false, identity: null, cue: null, minVersion: null, stages: [], progress: null,
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

describe('TaskForm: habits', () => {
  beforeEach(() => {
    api.createTask.mockResolvedValue({ id: 'n' })
    api.updateTask.mockResolvedValue({ id: 'h' })
  })

  const habitSwitch = () => screen.queryByRole('switch', { name: 'Habit' })

  test('the habit switch comes with a repeat only', () => {
    renderForm()
    expect(habitSwitch()).toBeNull()
    fireEvent.change(screen.getByLabelText('Kind'), { target: { value: 'schedule' } })
    expect(habitSwitch()).toBeTruthy()
    // Off: none of its fields yet.
    expect(screen.queryByLabelText('Who are you becoming?')).toBeNull()
  })

  test('a new habit saves who, the two-minute version and the suggested stages', async () => {
    renderForm()
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Read' } })
    fireEvent.change(screen.getByLabelText('Kind'), { target: { value: 'schedule' } })
    fireEvent.click(habitSwitch()!)
    fireEvent.change(screen.getByLabelText('Who are you becoming?'), { target: { value: ' I am a reader ' } })
    // No cue field any more; the habit's text fields grow like the title.
    expect(screen.queryByLabelText('When / where / after what')).toBeNull()
    for (const name of ['Who are you becoming?', 'Two-minute version', 'Stage 1: reward']) {
      const field = screen.getByLabelText(name) as HTMLTextAreaElement
      expect(field.tagName).toBe('TEXTAREA')
      expect(field.rows).toBe(1)
    }
    fireEvent.change(screen.getByLabelText('Two-minute version'), { target: { value: 'Read 1 page' } })
    // Suggested 10 / 30 / 66, counted in days for a daily habit.
    expect((screen.getByLabelText('Stage 1: days') as HTMLInputElement).value).toBe('10')
    expect((screen.getByLabelText('Stage 2: days') as HTMLInputElement).value).toBe('30')
    expect((screen.getByLabelText('Stage 3: days') as HTMLInputElement).value).toBe('66')
    fireEvent.change(screen.getByLabelText('Stage 1: reward'), { target: { value: 'New mouse' } })
    fireEvent.click(screen.getByRole('button', { name: 'Remove stage 3' }))
    fireEvent.click(save())
    await waitFor(() =>
      expect(api.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          repeatMode: 'schedule',
          isHabit: true,
          identity: 'I am a reader',
          cue: null,
          minVersion: 'Read 1 page',
          stages: [
            { days: 10, reward: 'New mouse' },
            { days: 30, reward: null },
          ],
        }),
      ),
    )
  })

  test('stages must go up: a stage not above the one before blocks saving', () => {
    renderForm()
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Read' } })
    fireEvent.change(screen.getByLabelText('Kind'), { target: { value: 'schedule' } })
    fireEvent.click(habitSwitch()!)
    expect(save().disabled).toBe(false)

    const second = screen.getByLabelText('Stage 2: days')
    fireEvent.change(second, { target: { value: '10' } })
    expect(save().disabled).toBe(true)
    expect(second.getAttribute('aria-invalid')).toBe('true')
    expect(screen.getByText('Each stage needs more than the one before (1–1000).')).toBeTruthy()

    fireEvent.change(second, { target: { value: '0' } })
    expect(save().disabled).toBe(true)
    fireEvent.change(second, { target: { value: '1001' } })
    expect(save().disabled).toBe(true)
    fireEvent.change(second, { target: { value: '20' } })
    // 66 after 20 is fine again.
    expect(save().disabled).toBe(false)
    expect(second.getAttribute('aria-invalid')).toBeNull()

    // Adding offers the next number up.
    fireEvent.click(screen.getByRole('button', { name: 'Add a stage' }))
    expect(Number((screen.getByLabelText('Stage 4: days') as HTMLInputElement).value)).toBeGreaterThan(66)
  })

  test('a weekly habit counts its stages in times', () => {
    renderForm()
    fireEvent.change(screen.getByLabelText('Kind'), { target: { value: 'schedule' } })
    fireEvent.change(screen.getByLabelText('Unit'), { target: { value: 'week' } })
    fireEvent.click(habitSwitch()!)
    expect(screen.getByLabelText('Stage 1: times')).toBeTruthy()
  })

  test('back to a one-off, it is no longer a habit', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <TaskForm task={habit('h')} onSaved={() => {}} onCancel={() => {}} />
      </QueryClientProvider>,
    )
    // An existing habit opens with its own stages.
    expect((screen.getByLabelText('Stage 2: days') as HTMLInputElement).value).toBe('30')
    fireEvent.change(screen.getByLabelText('Kind'), { target: { value: 'none' } })
    fireEvent.click(save())
    await waitFor(() =>
      expect(api.updateTask).toHaveBeenCalledWith('h', expect.objectContaining({ repeatMode: 'none', isHabit: false })),
    )
    expect(api.updateTask.mock.calls[0][1]).not.toHaveProperty('stages')
  })
})
