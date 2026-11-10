import { vi } from 'vitest'

/**
 * A browser with Web Push, for jsdom (which has none of it): a service worker
 * registration with a PushManager, Notification with a settable permission,
 * and the user agent / display mode that iOS detection reads.
 */
export interface FakePushOptions {
  permission?: NotificationPermission
  /** Grant or refuse when requestPermission() is called. */
  answer?: NotificationPermission
  subscribed?: boolean
  ua?: string
  maxTouchPoints?: number
  standalone?: boolean
  /** Leave out serviceWorker / PushManager / Notification entirely. */
  supported?: boolean
}

export const UA = {
  mac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
  iphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
}

const restorers: (() => void)[] = []

function override<T extends object>(target: T, key: string, value: unknown) {
  const own = Object.getOwnPropertyDescriptor(target, key)
  Object.defineProperty(target, key, { value, configurable: true, writable: true })
  restorers.push(() => {
    if (own) Object.defineProperty(target, key, own)
    else delete (target as Record<string, unknown>)[key]
  })
}

export function fakeSubscription(endpoint = 'https://push.example/device-1') {
  return {
    endpoint,
    expirationTime: null,
    options: { applicationServerKey: null },
    toJSON: () => ({ endpoint, expirationTime: null, keys: { p256dh: 'p256dh-key', auth: 'auth-key' } }),
    unsubscribe: vi.fn().mockResolvedValue(true),
  }
}

export function installFakePush(opts: FakePushOptions = {}) {
  const { supported = true, ua = UA.mac, maxTouchPoints = 0, standalone = false } = opts
  let permission: NotificationPermission = opts.permission ?? (opts.subscribed ? 'granted' : 'default')
  let current: ReturnType<typeof fakeSubscription> | null = opts.subscribed ? fakeSubscription() : null

  const pushManager = {
    getSubscription: vi.fn(async () => current),
    subscribe: vi.fn(async () => {
      current = fakeSubscription()
      current.unsubscribe.mockImplementation(async () => {
        current = null
        return true
      })
      return current
    }),
  }
  if (current) {
    current.unsubscribe.mockImplementation(async () => {
      current = null
      return true
    })
  }
  const registration = { pushManager }

  override(navigator, 'userAgent', ua)
  override(navigator, 'maxTouchPoints', maxTouchPoints)
  override(window, 'matchMedia', (query: string) => ({
    matches: query === '(display-mode: standalone)' ? standalone : false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }))

  const requestPermission = vi.fn(async () => {
    permission = opts.answer ?? 'granted'
    return permission
  })

  if (supported) {
    override(navigator, 'serviceWorker', {
      getRegistration: vi.fn(async () => registration),
      ready: Promise.resolve(registration),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
    override(window, 'PushManager', function PushManager() {})
    override(window, 'Notification', {
      get permission() {
        return permission
      },
      requestPermission,
    })
  }

  return { pushManager, requestPermission, current: () => current }
}

export function uninstallFakePush() {
  while (restorers.length) restorers.pop()!()
}
