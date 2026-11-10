import { deleteSubscription, fetchPublicKey, saveSubscription, type PushSubscriptionDto } from './api'

/**
 * Where this device stands with push, in the order it is checked:
 * - ios-needs-install: iPhone/iPad Safari only offers push to an app opened
 *   from the home screen; in a tab PushManager does not even exist.
 * - unsupported: no service worker, PushManager or Notification here.
 * - not-configured: the server has no VAPID keys yet.
 * - denied: the user blocked notifications; only browser settings undo that.
 * - off / on: permission aside, whether this device holds a subscription.
 */
export type PushState =
  | 'loading'
  | 'error'
  | 'unsupported'
  | 'ios-needs-install'
  | 'not-configured'
  | 'denied'
  | 'off'
  | 'on'

/** The server's VAPID key arrives base64url-encoded; subscribe() wants the raw bytes. */
export function urlBase64ToUint8Array(base64Url: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4)
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes
}

export function isIos(): boolean {
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua)) return true
  // iPadOS asks for the desktop site by default and so reports itself as a
  // Mac; a Mac with a touch screen does not exist.
  return /Macintosh/.test(ua) && navigator.maxTouchPoints > 1
}

export function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean }
  return nav.standalone === true || window.matchMedia('(display-mode: standalone)').matches
}

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

/** The states known without asking the server or the worker anything. */
export function detectBlocker(): 'ios-needs-install' | 'unsupported' | null {
  if (isIos() && !isStandalone()) return 'ios-needs-install'
  if (!isPushSupported()) return 'unsupported'
  return null
}

/**
 * The current subscription, without waiting. serviceWorker.ready never
 * settles when no worker is registered (npm run dev), so status checks use
 * getRegistration(), which answers at once.
 */
export async function getSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null
  const registration = await navigator.serviceWorker.getRegistration()
  return (await registration?.pushManager.getSubscription()) ?? null
}

const READY_TIMEOUT_MS = 10_000

/** The active worker, for subscribing; gives up rather than hanging the button forever. */
function readyRegistration(): Promise<ServiceWorkerRegistration> {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('no-service-worker')), READY_TIMEOUT_MS)),
  ])
}

export function toDto(subscription: PushSubscription): PushSubscriptionDto {
  const json = subscription.toJSON()
  return {
    endpoint: subscription.endpoint,
    keys: { p256dh: json.keys?.p256dh ?? '', auth: json.keys?.auth ?? '' },
    expirationTime: subscription.expirationTime ?? null,
    // Only used to name the device in the list; the server caps it too.
    userAgent: navigator.userAgent.slice(0, 300),
  }
}

/** Subscribes this device and registers it with the server. Permission must already be granted. */
export async function subscribeDevice(publicKey: string): Promise<PushSubscription> {
  const registration = await readyRegistration()
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  })
  try {
    await saveSubscription(toDto(subscription))
  } catch (err) {
    // A subscription the server never heard of would read as "on" here and
    // deliver nothing. Undo it so the switch tells the truth.
    await subscription.unsubscribe().catch(() => {})
    throw err
  }
  return subscription
}

/** Server first: if that fails the device stays subscribed and the page still says so. */
export async function unsubscribeDevice(): Promise<void> {
  const subscription = await getSubscription()
  if (!subscription) return
  await deleteSubscription(subscription.endpoint)
  await subscription.unsubscribe()
}

function sameKey(subscription: PushSubscription, publicKey: string): boolean {
  const current = subscription.options?.applicationServerKey
  // Some browsers do not expose it; assume it matches rather than churn.
  if (!current) return true
  const a = new Uint8Array(current)
  const b = urlBase64ToUint8Array(publicKey)
  return a.length === b.length && a.every((byte, i) => byte === b[i])
}

/**
 * On app start: tell the server about this device's subscription again. The
 * browser can rotate it (pushsubscriptionchange, which the worker cannot
 * report without a session), and the server prunes endpoints that bounced,
 * so without this a device could quietly fall out of the list. If the server's
 * key changed, the old subscription can never be delivered to: replace it.
 */
export async function resyncSubscription(): Promise<void> {
  if (detectBlocker() || Notification.permission !== 'granted') return
  const subscription = await getSubscription()
  if (!subscription) return
  const publicKey = await fetchPublicKey()
  if (!publicKey) return
  if (!sameKey(subscription, publicKey)) {
    await subscription.unsubscribe()
    await subscribeDevice(publicKey)
    return
  }
  await saveSubscription(toDto(subscription))
}

/**
 * On sign-out: this device stops receiving the account's reminders. Same
 * reasoning as clearApiCache: on a shared phone the next person must not get
 * the previous user's task digest. Best effort; the local unsubscribe alone is
 * enough, since the server prunes the dead endpoint on its next send.
 */
export async function forgetDevicePush(token: string | null): Promise<void> {
  try {
    const subscription = await getSubscription()
    if (!subscription) return
    if (token) await deleteSubscription(subscription.endpoint, token).catch(() => {})
    await subscription.unsubscribe()
  } catch {
    /* Nothing more to do on the way out. */
  }
}
