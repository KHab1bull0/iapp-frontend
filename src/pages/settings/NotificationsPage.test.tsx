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
  tasksDigest: true,
  tasksDigestAt: '08:00',
  tasksDigestUntil: '21:00',
  englishReminder: false,
  englishReminderAt: '20:00',
  habitReminders: true,
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

    const digest = await screen.findByRole('switch', { name: 'Tasks: hourly reminder' })
    expect(digest.getAttribute('aria-checked')).toBe('true')
    // Only a reminder that is on shows its time.
    expect((screen.getByLabelText('Tasks: hourly reminder: from') as HTMLInputElement).value).toBe('08:00')
    expect(screen.queryByLabelText('English reminder: time')).toBeNull()

    fireEvent.click(screen.getByRole('switch', { name: 'English reminder' }))
    await waitFor(() => expect(api.updateSettings).toHaveBeenCalledWith({ englishReminder: true }))
    expect(await screen.findByLabelText('English reminder: time')).toBeTruthy()

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

  test('on: three reminders — hourly tasks, timed tasks, English — and nothing else', async () => {
    installFakePush({ subscribed: true })
    renderPage()

    await screen.findByRole('switch', { name: 'Tasks: hourly reminder' })
    expect(screen.getAllByRole('switch').map((s) => s.getAttribute('aria-label'))).toEqual([
      'Tasks: hourly reminder',
      'Timed tasks',
      'English reminder',
    ])
    expect(screen.queryByText('Streak at risk')).toBeNull()
    expect(screen.queryByText('Weekly review')).toBeNull()

    // Timed tasks fire at each habit's own time: a switch, no time row.
    const timed = screen.getByRole('switch', { name: 'Timed tasks' })
    expect(timed.getAttribute('aria-checked')).toBe('true')
    expect(screen.queryByLabelText('Timed tasks: time')).toBeNull()
    fireEvent.click(timed)
    await waitFor(() => expect(api.updateSettings).toHaveBeenCalledWith({ habitReminders: false }))
  })

  test('on: a reminder time is saved once, after typing stops', async () => {
    installFakePush({ subscribed: true })
    renderPage()
    const time = (await screen.findByLabelText('Tasks: hourly reminder: from')) as HTMLInputElement
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    try {
      fireEvent.change(time, { target: { value: '09:3' } })
      fireEvent.change(time, { target: { value: '09:30' } })
      await act(() => vi.advanceTimersByTimeAsync(799))
      expect(api.updateSettings).not.toHaveBeenCalled()
      await act(() => vi.advanceTimersByTimeAsync(1))
      expect(api.updateSettings).toHaveBeenCalledTimes(1)
      expect(api.updateSettings).toHaveBeenCalledWith({ tasksDigestAt: '09:30' })
    } finally {
      vi.useRealTimers()
    }
  })

  test('on: the hourly reminders run from one time until another, and the until is saved', async () => {
    installFakePush({ subscribed: true })
    renderPage()
    const from = (await screen.findByLabelText('Tasks: hourly reminder: from')) as HTMLInputElement
    const until = screen.getByLabelText('Tasks: hourly reminder: until') as HTMLInputElement
    expect(from.value).toBe('08:00')
    expect(until.value).toBe('21:00')

    fireEvent.change(until, { target: { value: '22:00' } })
    fireEvent.blur(until)
    await waitFor(() => expect(api.updateSettings).toHaveBeenCalledWith({ tasksDigestUntil: '22:00' }))
  })

  test('on: an until before the from is not sent, and says why', async () => {
    installFakePush({ subscribed: true })
    renderPage()
    const until = (await screen.findByLabelText('Tasks: hourly reminder: until')) as HTMLInputElement
    fireEvent.change(until, { target: { value: '07:00' } })
    fireEvent.blur(until)
    expect(await screen.findByText("The last hour can't be before the first")).toBeTruthy()
    expect(api.updateSettings).not.toHaveBeenCalled()
    expect(until.value).toBe('21:00')
  })

  test('off: the hourly reminders hide both their times', async () => {
    installFakePush({ subscribed: true })
    api.fetchSettings.mockResolvedValue({ ...SETTINGS, tasksDigest: false })
    renderPage()
    await screen.findByRole('switch', { name: 'Tasks: hourly reminder' })
    expect(screen.queryByLabelText('Tasks: hourly reminder: from')).toBeNull()
    expect(screen.queryByLabelText('Tasks: hourly reminder: until')).toBeNull()
  })

  test('a failed save puts the switch back', async () => {
    installFakePush({ subscribed: true })
    api.updateSettings.mockRejectedValue(new Error('offline'))
    renderPage()
    const digest = await screen.findByRole('switch', { name: 'Tasks: hourly reminder' })
    fireEvent.click(digest)
    expect(await screen.findByText("Couldn't save the setting")).toBeTruthy()
    expect(screen.getByRole('switch', { name: 'Tasks: hourly reminder' }).getAttribute('aria-checked')).toBe('true')
  })
})
