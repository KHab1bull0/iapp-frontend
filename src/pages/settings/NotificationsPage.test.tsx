import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ToastHost } from '@/core/components/ui/toast'
import { installFakePush, uninstallFakePush, UA } from '@/test/push'
import { NotificationsPage } from './NotificationsPage'

const api = vi.hoisted(() => ({
  notificationKeys: {
    publicKey: ['notifications', 'public-key'],
    settings: ['notifications', 'settings'],
    devices: ['notifications', 'devices'],
  },
  fetchPublicKey: vi.fn(),
  saveSubscription: vi.fn(),
  deleteSubscription: vi.fn(),
  fetchDevices: vi.fn(),
  fetchSettings: vi.fn(),
  updateSettings: vi.fn(),
  sendTest: vi.fn(),
}))
vi.mock('@/core/notifications/api', () => api)

const KEY = 'BDxrGylovc0doQJluj-uAqzxpEHkJfyjVfondqgBadfog-sk7pdjyiIM6SHz6wFBAmN-6The2oDbxDIQbulnM8g'
const SETTINGS = {
  activeFrom: '08:00',
  activeUntil: '21:00',
  tasksDigest: true,
  habitReminders: true,
  englishReminder: false,
  financeReminder: true,
}

function renderPage() {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <NotificationsPage />
        <ToastHost />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('NotificationsPage', () => {
  beforeEach(() => {
    api.fetchPublicKey.mockResolvedValue(KEY)
    api.saveSubscription.mockResolvedValue(undefined)
    api.deleteSubscription.mockResolvedValue(undefined)
    api.fetchDevices.mockResolvedValue([])
    api.fetchSettings.mockResolvedValue(SETTINGS)
    api.updateSettings.mockImplementation(async (patch: object) => ({ ...SETTINGS, ...patch }))
    api.sendTest.mockResolvedValue(2)
  })
  afterEach(() => {
    uninstallFakePush()
    vi.clearAllMocks()
  })

  test('the server without push keys: a calm "not yet", no button', async () => {
    installFakePush()
    api.fetchPublicKey.mockResolvedValue(null)
    renderPage()
    expect(await screen.findByText('Notifications are not available yet')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Turn on notifications' })).toBeNull()
  })

  test('iPhone Safari in a tab: the Add to Home Screen steps', () => {
    installFakePush({ ua: UA.iphone, supported: false })
    renderPage()
    expect(screen.getByText('Add IAPP to your Home Screen first')).toBeTruthy()
    expect(screen.getByText('Choose “Add to Home Screen”')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Turn on notifications' })).toBeNull()
  })

  test('while this device is checked: a busy card shaped like the status card', async () => {
    installFakePush()
    const { container } = renderPage()
    expect(container.querySelector('[aria-busy="true"]')?.textContent).toContain('Loading…')
    await screen.findByRole('button', { name: 'Turn on notifications' })
    expect(container.querySelector('[aria-busy="true"]')).toBeNull()
  })

  test('blocked: explains where to allow it', async () => {
    installFakePush({ permission: 'denied' })
    renderPage()
    expect(await screen.findByText('Notifications are blocked')).toBeTruthy()
    expect(screen.getByText('iPhone: Settings → Notifications → IAPP')).toBeTruthy()
  })

  test('off → enable subscribes and registers the device', async () => {
    const push = installFakePush()
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Turn on notifications' }))

    await waitFor(() => expect(api.saveSubscription).toHaveBeenCalled())
    expect(push.requestPermission).toHaveBeenCalled()
    expect(push.pushManager.subscribe).toHaveBeenCalledWith(expect.objectContaining({ userVisibleOnly: true }))
    expect(api.saveSubscription.mock.calls[0][0]).toMatchObject({
      endpoint: 'https://push.example/device-1',
      keys: { p256dh: 'p256dh-key', auth: 'auth-key' },
    })
    expect(await screen.findByText('Notifications are on')).toBeTruthy()
  })

  test('on: reminders save on toggle, and the test button reports the devices reached', async () => {
    installFakePush({ subscribed: true })
    api.fetchDevices.mockResolvedValue([
      { id: 'd1', userAgent: UA.iphone, createdAt: '2026-11-01T08:00:00Z', lastSuccessAt: null },
    ])
    renderPage()

    const digest = await screen.findByRole('switch', { name: 'Tasks: Hourly reminder' })
    expect(digest.getAttribute('aria-checked')).toBe('true')

    const english = screen.getByRole('switch', { name: 'English: Every 3 hours' })
    expect(english.getAttribute('aria-checked')).toBe('false')
    fireEvent.click(english)
    await waitFor(() => expect(api.updateSettings).toHaveBeenCalledWith({ englishReminder: true }))

    fireEvent.click(screen.getByRole('button', { name: 'Send a test notification' }))
    await waitFor(() => expect(api.sendTest).toHaveBeenCalled())
    expect(await screen.findByText('Sent to 2 devices')).toBeTruthy()

    expect(await screen.findByText('iPhone · Safari')).toBeTruthy()
    expect(screen.getByText('Nothing delivered yet')).toBeTruthy()
  })

  test('on: the reminders show a busy skeleton while they load, and the test button waits for its request', async () => {
    installFakePush({ subscribed: true })
    api.fetchSettings.mockReturnValue(new Promise(() => {}))
    api.sendTest.mockReturnValue(new Promise(() => {}))
    const { container } = renderPage()

    const test = await screen.findByRole('button', { name: 'Send a test notification' })
    const busy = container.querySelector('[aria-busy="true"]')
    expect(busy?.textContent).toContain('Loading…')
    expect(screen.queryByRole('switch')).toBeNull()

    fireEvent.click(test)
    const sending = (await screen.findByRole('button', { name: 'Sending…' })) as HTMLButtonElement
    expect(sending.disabled).toBe(true)
  })

  test('on: a test that reached nobody says what to try', async () => {
    installFakePush({ subscribed: true })
    api.sendTest.mockResolvedValue(0)
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Send a test notification' }))
    expect(await screen.findByText(/didn't reach any device/)).toBeTruthy()
  })

  test('on: the groups are General, Tasks, English, Finance, in that order', async () => {
    installFakePush({ subscribed: true })
    renderPage()

    await screen.findByRole('switch', { name: 'Tasks: Hourly reminder' })
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    // The status card's heading comes first, then the reminder groups, then the devices (none here).
    expect(headings.slice(1)).toEqual(['General', 'Tasks', 'English', 'Finance'])
    expect(screen.getAllByRole('switch').map((s) => s.getAttribute('aria-label'))).toEqual([
      'Tasks: Hourly reminder',
      'Tasks: Timed tasks',
      'English: Every 3 hours',
      'Finance: Every 3 hours',
    ])
    // The only times on the page are the shared active hours.
    expect(screen.getAllByLabelText(/^Active hours: /)).toHaveLength(2)
    expect(document.querySelectorAll('input[type="time"]')).toHaveLength(2)
  })

  test('on: the timed tasks switch saves', async () => {
    installFakePush({ subscribed: true })
    renderPage()
    const timed = await screen.findByRole('switch', { name: 'Tasks: Timed tasks' })
    expect(timed.getAttribute('aria-checked')).toBe('true')
    fireEvent.click(timed)
    await waitFor(() => expect(api.updateSettings).toHaveBeenCalledWith({ habitReminders: false }))
  })

  test('on: the finance switch saves', async () => {
    installFakePush({ subscribed: true })
    renderPage()
    const finance = await screen.findByRole('switch', { name: 'Finance: Every 3 hours' })
    expect(finance.getAttribute('aria-checked')).toBe('true')
    fireEvent.click(finance)
    await waitFor(() => expect(api.updateSettings).toHaveBeenCalledWith({ financeReminder: false }))
    expect(screen.getByRole('switch', { name: 'Finance: Every 3 hours' }).getAttribute('aria-checked')).toBe('false')
  })

  test('on: an active-hours time is saved once, after typing stops', async () => {
    installFakePush({ subscribed: true })
    renderPage()
    const time = (await screen.findByLabelText('Active hours: From')) as HTMLInputElement
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    try {
      fireEvent.change(time, { target: { value: '09:3' } })
      fireEvent.change(time, { target: { value: '09:30' } })
      await act(() => vi.advanceTimersByTimeAsync(799))
      expect(api.updateSettings).not.toHaveBeenCalled()
      await act(() => vi.advanceTimersByTimeAsync(1))
      expect(api.updateSettings).toHaveBeenCalledTimes(1)
      expect(api.updateSettings).toHaveBeenCalledWith({ activeFrom: '09:30' })
    } finally {
      vi.useRealTimers()
    }
  })

  test('on: the active hours run from one time until another, and the until is saved', async () => {
    installFakePush({ subscribed: true })
    renderPage()
    const from = (await screen.findByLabelText('Active hours: From')) as HTMLInputElement
    const until = screen.getByLabelText('Active hours: Until') as HTMLInputElement
    expect(from.value).toBe('08:00')
    expect(until.value).toBe('21:00')

    fireEvent.change(until, { target: { value: '22:00' } })
    fireEvent.blur(until)
    await waitFor(() => expect(api.updateSettings).toHaveBeenCalledWith({ activeUntil: '22:00' }))
  })

  test('on: an until before the from is not sent, and says why', async () => {
    installFakePush({ subscribed: true })
    renderPage()
    const until = (await screen.findByLabelText('Active hours: Until')) as HTMLInputElement
    fireEvent.change(until, { target: { value: '07:00' } })
    fireEvent.blur(until)
    expect(await screen.findByText("The last hour can't be before the first")).toBeTruthy()
    expect(api.updateSettings).not.toHaveBeenCalled()
    expect(until.value).toBe('21:00')
  })

  test('on: the active hours stay while every reminder is off', async () => {
    installFakePush({ subscribed: true })
    api.fetchSettings.mockResolvedValue({
      ...SETTINGS,
      tasksDigest: false,
      habitReminders: false,
      englishReminder: false,
      financeReminder: false,
    })
    renderPage()
    await screen.findByRole('switch', { name: 'Tasks: Hourly reminder' })
    expect(screen.getByLabelText('Active hours: From')).toBeTruthy()
    expect(screen.getByLabelText('Active hours: Until')).toBeTruthy()
  })

  test('a failed save puts the switch back', async () => {
    installFakePush({ subscribed: true })
    api.updateSettings.mockRejectedValue(new Error('offline'))
    renderPage()
    const digest = await screen.findByRole('switch', { name: 'Tasks: Hourly reminder' })
    fireEvent.click(digest)
    expect(await screen.findByText("Couldn't save the setting")).toBeTruthy()
    expect(screen.getByRole('switch', { name: 'Tasks: Hourly reminder' }).getAttribute('aria-checked')).toBe('true')
  })
})
