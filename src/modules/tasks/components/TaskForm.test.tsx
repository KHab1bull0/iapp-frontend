import { beforeEach, describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { todayYmd } from '@/core/lib/format'
import { habit } from '@/modules/tasks/test-data'
import { TaskForm } from './TaskForm'

const api = vi.hoisted(() => ({ createTask: vi.fn(), updateTask: vi.fn(), deleteTask: vi.fn() }))
vi.mock('@/modules/tasks/api/tasks', async (orig) => ({ ...(await orig<object>()), ...api }))
const groupsApi = vi.hoisted(() => ({ fetchGroups: vi.fn() }))
vi.mock('@/modules/tasks/api/groups', async (orig) => ({ ...(await orig<object>()), ...groupsApi }))

const WORK = { id: 'g1', name: 'Work', createdAt: '' }
const HOME = { id: 'g2', name: 'Home', createdAt: '' }

// No groups unless a test gives some.
beforeEach(() => {
  groupsApi.fetchGroups.mockResolvedValue([])
})

function renderForm() {
  const onSaved = vi.fn()
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <TaskForm task={null} onSaved={onSaved} onCancel={() => {}} />
      </MemoryRouter>
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

  test('the title keeps its line breaks: Enter is a new line, Ctrl/Cmd+Enter saves', async () => {
    renderForm()
    const title = screen.getByLabelText('Title') as HTMLTextAreaElement
    const note = screen.getByLabelText('Note') as HTMLTextAreaElement
    expect(title.tagName).toBe('TEXTAREA')
    expect(title.rows).toBe(1)
    expect(note.tagName).toBe('TEXTAREA')
    expect(note.rows).toBe(1)
    fireEvent.change(title, { target: { value: 'Hisobot\nyozish' } })
    expect(title.value).toBe('Hisobot\nyozish')
    // Enter adds a line (the browser's own), it does not save.
    fireEvent.keyDown(title, { key: 'Enter' })
    expect(api.createTask).not.toHaveBeenCalled()
    fireEvent.keyDown(title, { key: 'Enter', ctrlKey: true })
    await waitFor(() =>
      expect(api.createTask).toHaveBeenCalledWith(expect.objectContaining({ title: 'Hisobot\nyozish' })),
    )
    api.createTask.mockClear()
    fireEvent.keyDown(title, { key: 'Enter', metaKey: true })
    await waitFor(() => expect(api.createTask).toHaveBeenCalled())
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

  test('the reminder comes with a time only, and a new timed task is reminded 15 minutes before', async () => {
    renderForm()
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Call mum' } })
    expect(screen.queryByLabelText('Reminder')).toBeNull()
    fireEvent.change(screen.getByLabelText('Time'), { target: { value: '18:30' } })
    const remind = screen.getByLabelText('Reminder') as HTMLSelectElement
    expect(remind.tagName).toBe('SELECT')
    expect([...remind.options].map((o) => o.text)).toEqual([
      'At the time',
      '5 minutes before',
      '15 minutes before',
      '30 minutes before',
      '1 hour before',
      'No reminder',
    ])
    expect(remind.selectedOptions[0].text).toBe('15 minutes before')
    fireEvent.click(save())
    await waitFor(() =>
      expect(api.createTask).toHaveBeenCalledWith(expect.objectContaining({ dueTime: '18:30', remindBefore: 15 })),
    )
    // Without the time, the field goes again.
    fireEvent.change(screen.getByLabelText('Time'), { target: { value: '' } })
    expect(screen.queryByLabelText('Reminder')).toBeNull()
  })

  test('an existing task opens with its own reminder, and "No reminder" is sent as null', async () => {
    api.updateTask.mockResolvedValue({ id: 'h' })
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <TaskForm task={habit('h', { dueTime: '07:00', remindBefore: 60 })} onSaved={() => {}} onCancel={() => {}} />
        </MemoryRouter>
      </QueryClientProvider>,
    )
    const remind = screen.getByLabelText('Reminder') as HTMLSelectElement
    expect(remind.selectedOptions[0].text).toBe('1 hour before')
    fireEvent.change(remind, { target: { value: 'none' } })
    fireEvent.click(save())
    await waitFor(() =>
      expect(api.updateTask).toHaveBeenCalledWith('h', expect.objectContaining({ dueTime: '07:00', remindBefore: null })),
    )
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

  test('without groups: no chips, a quiet link to add one, and saved with no group', async () => {
    renderForm()
    const link = await screen.findByRole('link', { name: 'Add a group' })
    expect(link.getAttribute('href')).toBe('/tasks/settings')
    expect(screen.queryByRole('group', { name: 'Task group' })).toBeNull()
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Call mum' } })
    fireEvent.click(save())
    await waitFor(() => expect(api.createTask).toHaveBeenCalledWith(expect.objectContaining({ groupId: null })))
  })

  test('a chip per group, none chosen at first: a tap chooses, another clears, and the choice is saved', async () => {
    groupsApi.fetchGroups.mockResolvedValue([WORK, HOME])
    renderForm()
    const chips = await screen.findByRole('group', { name: 'Task group' })
    const work = within(chips).getByRole('button', { name: 'Work' })
    const home = within(chips).getByRole('button', { name: 'Home' })
    expect(work.getAttribute('aria-pressed')).toBe('false')
    expect(home.getAttribute('aria-pressed')).toBe('false')
    expect(screen.queryByRole('link', { name: 'Add a group' })).toBeNull()

    fireEvent.click(work)
    expect(work.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(home)
    expect(work.getAttribute('aria-pressed')).toBe('false')
    expect(home.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(home)
    expect(home.getAttribute('aria-pressed')).toBe('false')

    fireEvent.click(work)
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Report' } })
    fireEvent.click(save())
    await waitFor(() => expect(api.createTask).toHaveBeenCalledWith(expect.objectContaining({ groupId: 'g1' })))
  })

  test("an existing task opens with its group chosen; clearing it sends null", async () => {
    groupsApi.fetchGroups.mockResolvedValue([WORK, HOME])
    api.updateTask.mockResolvedValue({ id: 'h' })
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <TaskForm task={habit('h', { groupId: 'g2' })} onSaved={() => {}} onCancel={() => {}} />
        </MemoryRouter>
      </QueryClientProvider>,
    )
    const home = await screen.findByRole('button', { name: 'Home' })
    expect(home.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(home)
    fireEvent.click(save())
    await waitFor(() => expect(api.updateTask).toHaveBeenCalledWith('h', expect.objectContaining({ groupId: null })))
  })

  test('an existing task can be deleted after confirming', async () => {
    api.deleteTask.mockResolvedValue(undefined)
    const onSaved = vi.fn()
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <TaskForm
            task={{
              id: 't1', title: 'Old', note: null, dueDate: null, dueTime: null, remindBefore: 15, repeatMode: 'none',
              repeatUnit: null, repeatEvery: null, repeatWeekdays: null, repeatMonthDay: null, completedAt: null,
              createdAt: '', updatedAt: '',
              isHabit: false, identity: null, cue: null, progress: null, groupId: null,
            }}
            onSaved={onSaved}
            onCancel={() => {}}
          />
        </MemoryRouter>
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

  test('a new habit asks only who it makes you, and saves it', async () => {
    renderForm()
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Read' } })
    fireEvent.change(screen.getByLabelText('Kind'), { target: { value: 'schedule' } })
    fireEvent.click(habitSwitch()!)
    const who = screen.getByLabelText('Who are you becoming?') as HTMLTextAreaElement
    // The habit's text field grows like the title.
    expect(who.tagName).toBe('TEXTAREA')
    expect(who.rows).toBe(1)
    fireEvent.change(who, { target: { value: ' I am a reader ' } })
    // Nothing else under the switch: no cue, no two-minute version, no stages.
    const group = habitSwitch()!.closest('div[class]')!.parentElement!
    expect(within(group).getAllByRole('textbox')).toHaveLength(1)
    expect(within(group).queryByRole('spinbutton')).toBeNull()
    expect(within(group).queryByRole('button')).toBeNull()
    fireEvent.click(save())
    await waitFor(() =>
      expect(api.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          repeatMode: 'schedule',
          isHabit: true,
          identity: 'I am a reader',
          cue: null,
        }),
      ),
    )
    expect(api.createTask.mock.calls[0][0]).not.toHaveProperty('stages')
  })

  test('back to a one-off, it is no longer a habit', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <TaskForm task={habit('h')} onSaved={() => {}} onCancel={() => {}} />
        </MemoryRouter>
      </QueryClientProvider>,
    )
    // An existing habit opens with its own who.
    expect((screen.getByLabelText('Who are you becoming?') as HTMLTextAreaElement).value).toBe('I am a reader')
    fireEvent.change(screen.getByLabelText('Kind'), { target: { value: 'none' } })
    fireEvent.click(save())
    await waitFor(() =>
      expect(api.updateTask).toHaveBeenCalledWith('h', expect.objectContaining({ repeatMode: 'none', isHabit: false })),
    )
    expect(api.updateTask.mock.calls[0][1]).not.toHaveProperty('stages')
  })
})
