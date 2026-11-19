import { beforeEach, describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ToastHost } from '@/core/components/ui/toast'
import { todayYmd } from '@/core/lib/format'
import type { Task } from '@/modules/tasks/api/tasks'
import { TodayPage } from './TodayPage'

const api = vi.hoisted(() => ({
  fetchToday: vi.fn(),
  completeTask: vi.fn(),
  undoCompletion: vi.fn(),
  updateTask: vi.fn(),
  fetchOverallStats: vi.fn(),
}))
vi.mock('@/modules/tasks/api/tasks', async (orig) => ({ ...(await orig<object>()), ...api }))
// The user's task groups: none, unless a test gives some.
const groupsApi = vi.hoisted(() => ({ fetchGroups: vi.fn().mockResolvedValue([]) }))
vi.mock('@/modules/tasks/api/groups', async (orig) => ({ ...(await orig<object>()), ...groupsApi }))

const t = (id: string, over: Partial<Task> = {}): Task => ({
  id,
  title: id.toUpperCase(),
  note: null,
  dueDate: todayYmd(),
  dueTime: null,
  remindBefore: 15,
  repeatMode: 'none',
  repeatUnit: null,
  repeatEvery: null,
  repeatWeekdays: null,
  repeatMonthDay: null,
  completedAt: null,
  createdAt: '',
  updatedAt: '',
  isHabit: false, identity: null, cue: null, progress: null, groupId: null,
  ...over,
})

function renderPage() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <TodayPage />
        <ToastHost />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('TodayPage', () => {
  beforeEach(() => {
    api.fetchToday.mockResolvedValue({
      overdue: [t('a', { dueDate: '2026-01-01', repeatMode: 'schedule', repeatUnit: 'day', repeatEvery: 1 })],
      today: [t('b', { dueTime: '09:30' })],
      doneToday: [{ completionId: 'c0', task: t('c') }],
    })
    api.completeTask.mockResolvedValue({ task: t('b'), completionId: 'c1' })
    api.undoCompletion.mockResolvedValue(t('b'))
    api.fetchOverallStats.mockResolvedValue({ total: 0, daily: [] })
    groupsApi.fetchGroups.mockResolvedValue([])
  })

  test("shows today and what's done; earlier days folded away at the end, without red", async () => {
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Today' })).toBeTruthy()
    expect(screen.getByText('09:30')).toBeTruthy()
    // Done is a plain group, not folded.
    expect(screen.getByRole('heading', { name: 'Done' })).toBeTruthy()
    expect(screen.getByText('C')).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'Overdue' })).toBeNull()
    // Earlier days: last on the page, folded by default.
    const fold = screen.getByRole('button', { name: /Not done/ })
    expect(fold.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByText('A')).toBeNull()
    fireEvent.click(fold)
    expect(screen.getByText('A')).toBeTruthy()
    expect(screen.getByText('Every day')).toBeTruthy()
    fireEvent.click(fold)
    expect(screen.queryByText('A')).toBeNull()
  })

  test('shows how far through the day you are', async () => {
    renderPage()
    expect(await screen.findByRole('progressbar', { name: '1 of 2 done' })).toBeTruthy()
  })

  test('ticking a task completes it for today, and Undo puts it back', async () => {
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Complete B' }))
    await waitFor(() => expect(api.completeTask).toHaveBeenCalledWith('b', todayYmd(), todayYmd()))
    fireEvent.click(await screen.findByRole('button', { name: 'Undo' }))
    await waitFor(() => expect(api.undoCompletion).toHaveBeenCalledWith('c1'))
  })

  test('says so when nothing is due', async () => {
    api.fetchToday.mockResolvedValue({ overdue: [], today: [], doneToday: [] })
    renderPage()
    expect(await screen.findByText('Nothing due today')).toBeTruthy()
  })

  test('a task can be ticked only once while the request is in flight', async () => {
    api.completeTask.mockReturnValue(new Promise(() => {}))
    renderPage()
    const tick = (await screen.findByRole('button', { name: 'Complete B' })) as HTMLButtonElement
    fireEvent.click(tick)
    await waitFor(() => expect(tick.disabled).toBe(true))
    fireEvent.click(tick)
    expect(api.completeTask).toHaveBeenCalledTimes(1)
  })

  test('tasks with a time come first, earliest at the top', async () => {
    api.fetchToday.mockResolvedValue({
      overdue: [],
      today: [t('u'), t('b', { dueTime: '09:30' }), t('e', { dueTime: '07:00' })],
      doneToday: [],
    })
    renderPage()
    await screen.findByText('U')
    const titles = screen.getAllByRole('button', { name: /^Complete / }).map((b) => b.getAttribute('aria-label'))
    expect(titles).toEqual(['Complete E', 'Complete B', 'Complete U'])
  })

  test('reads Uzbek when Uzbek is chosen', async () => {
    localStorage.setItem('iapp-lang', 'uz')
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Bugun' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Bajarilgan' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Bajarilmagan/ }))
    expect(screen.getByText('Har kuni')).toBeTruthy()
  })

  test('the page in outline while the day loads, then the day in its place', async () => {
    let resolve!: (v: unknown) => void
    api.fetchToday.mockReturnValue(new Promise((r) => (resolve = r)))
    renderPage()
    const busy = screen.getAllByText('Loading…')[0].closest('[aria-busy="true"]')
    expect(busy).toBeTruthy()
    // Shapes, not words: no section headings and no rows until the day is in.
    expect(screen.queryByRole('heading', { name: 'Today' })).toBeNull()
    expect(screen.queryByRole('button', { name: /^Complete / })).toBeNull()

    resolve({ overdue: [], today: [t('b')], doneToday: [] })
    expect(await screen.findByRole('heading', { name: 'Today' })).toBeTruthy()
    await waitFor(() => expect(document.querySelector('[aria-busy="true"]')).toBeNull())
    expect(screen.queryByText('Loading…')).toBeNull()
  })

  test("the activity rail holds its place while its numbers load", async () => {
    api.fetchOverallStats.mockReturnValue(new Promise(() => {}))
    renderPage()
    await screen.findByRole('heading', { name: 'Today' })
    const rail = screen.getByRole('region', { name: 'Activity' })
    expect(rail.getAttribute('aria-busy')).toBe('true')
    expect(within(rail).getByText('Loading…')).toBeTruthy()
  })

  test('unticking waits for its request: the done tick is disabled meanwhile', async () => {
    api.undoCompletion.mockReturnValue(new Promise(() => {}))
    renderPage()
    const untick = (await screen.findByRole('button', { name: 'Undo C' })) as HTMLButtonElement
    fireEvent.click(untick)
    await waitFor(() => expect(untick.disabled).toBe(true))
    expect(untick.getAttribute('aria-busy')).toBe('true')
    fireEvent.click(untick)
    expect(api.undoCompletion).toHaveBeenCalledTimes(1)
  })

  test('tasks with a group colour carry the accent stripe; order stays by time', async () => {
    groupsApi.fetchGroups.mockResolvedValue([
      { id: 'g1', name: 'Work', color: '#93c5fd', createdAt: '' },
      { id: 'g2', name: 'Home', color: '#86efac', createdAt: '' },
    ])
    api.fetchToday.mockResolvedValue({
      overdue: [],
      today: [
        t('u'),
        t('b', { dueTime: '09:30', groupId: 'g2' }),
        t('e', { dueTime: '07:00', groupId: 'g1' }),
      ],
      doneToday: [],
    })
    renderPage()
    // All tasks render as one flat list in time order (E → B → U).
    const btns = await screen.findAllByRole('button', { name: /^Complete / })
    expect(btns.map((b) => b.getAttribute('aria-label'))).toEqual(['Complete E', 'Complete B', 'Complete U'])
    // No group-label sub-sections.
    expect(screen.queryByText('Work')).toBeNull()
    expect(screen.queryByText('No group')).toBeNull()
    // The rows with a colour have --accent set on their wrapper.
    const eWrap = btns[0].closest('[style]')
    const bWrap = btns[1].closest('[style]')
    expect(eWrap?.getAttribute('style')).toContain('--accent: #93c5fd')
    expect(bWrap?.getAttribute('style')).toContain('--accent: #86efac')
    // A task with no group has no style attribute.
    expect(btns[2].closest('[style]')).toBeNull()
  })
})
