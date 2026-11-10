import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { installFakePush, uninstallFakePush, UA } from '@/test/push'
import { usePushState } from './usePushState'

const api = vi.hoisted(() => ({
  notificationKeys: {
    publicKey: ['notifications', 'public-key'],
    settings: ['notifications', 'settings'],
    devices: ['notifications', 'devices'],
  },
  fetchPublicKey: vi.fn(),
  saveSubscription: vi.fn(),
  deleteSubscription: vi.fn(),
}))
vi.mock('./api', () => api)

const KEY = 'BDxrGylovc0doQJluj-uAqzxpEHkJfyjVfondqgBadfog-sk7pdjyiIM6SHz6wFBAmN-6The2oDbxDIQbulnM8g'

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
}

async function settled() {
  const hook = renderHook(() => usePushState(), { wrapper })
  await waitFor(() => expect(hook.result.current.state).not.toBe('loading'))
  return hook
}

describe('usePushState', () => {
  beforeEach(() => {
    api.fetchPublicKey.mockResolvedValue(KEY)
    api.saveSubscription.mockResolvedValue(undefined)
    api.deleteSubscription.mockResolvedValue(undefined)
  })
  afterEach(() => {
    uninstallFakePush()
    vi.clearAllMocks()
  })

  test('no push support at all', async () => {
    installFakePush({ supported: false })
    const { result } = renderHook(() => usePushState(), { wrapper })
    expect(result.current.state).toBe('unsupported')
    expect(api.fetchPublicKey).not.toHaveBeenCalled()
  })

  test('iPhone Safari in a tab is told to install, not "unsupported"', () => {
    installFakePush({ ua: UA.iphone, supported: false })
    const { result } = renderHook(() => usePushState(), { wrapper })
    expect(result.current.state).toBe('ios-needs-install')
  })

  test('the server without VAPID keys', async () => {
    installFakePush()
    api.fetchPublicKey.mockResolvedValue(null)
    const { result } = await settled()
    expect(result.current.state).toBe('not-configured')
  })

  test('blocked in the browser', async () => {
    installFakePush({ permission: 'denied' })
    const { result } = await settled()
    expect(result.current.state).toBe('denied')
  })

  test('off, then on: asks, subscribes with the server key and registers the device', async () => {
    const push = installFakePush()
    const { result } = await settled()
    expect(result.current.state).toBe('off')

    await act(() => result.current.enable())

    expect(push.requestPermission).toHaveBeenCalled()
    expect(push.pushManager.subscribe).toHaveBeenCalledWith({
      userVisibleOnly: true,
      applicationServerKey: expect.any(Uint8Array),
    })
    expect(api.saveSubscription).toHaveBeenCalledWith({
      endpoint: 'https://push.example/device-1',
      keys: { p256dh: 'p256dh-key', auth: 'auth-key' },
      expirationTime: null,
      userAgent: UA.mac,
    })
    expect(result.current.state).toBe('on')
  })

  test('a refused prompt leaves it blocked and subscribes nothing', async () => {
    const push = installFakePush({ answer: 'denied' })
    const { result } = await settled()
    let answer: NotificationPermission | undefined
    await act(async () => {
      answer = await result.current.enable()
    })
    expect(answer).toBe('denied')
    expect(push.pushManager.subscribe).not.toHaveBeenCalled()
    expect(result.current.state).toBe('denied')
  })

  test('if the server rejects the subscription, the device unsubscribes again', async () => {
    const push = installFakePush()
    api.saveSubscription.mockRejectedValue(new Error('500'))
    const { result } = await settled()
    await act(async () => {
      await expect(result.current.enable()).rejects.toThrow('500')
    })
    expect(push.current()).toBeNull()
    expect(result.current.state).toBe('off')
  })

  test('on: turning off tells the server first, then unsubscribes', async () => {
    const push = installFakePush({ subscribed: true })
    const sub = push.current()!
    const { result } = await settled()
    expect(result.current.state).toBe('on')

    await act(() => result.current.disable())

    expect(api.deleteSubscription).toHaveBeenCalledWith('https://push.example/device-1')
    expect(sub.unsubscribe).toHaveBeenCalled()
    expect(result.current.state).toBe('off')
  })

  test('a subscription left behind after permission was reset reads as off', async () => {
    installFakePush({ subscribed: true, permission: 'default' })
    const { result } = await settled()
    expect(result.current.state).toBe('off')
  })
})
