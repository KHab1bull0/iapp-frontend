import api from '@/core/api/axios'

/** What the server stores per device: the browser's PushSubscription, flattened. */
export interface PushSubscriptionDto {
  endpoint: string
  keys: { p256dh: string; auth: string }
  expirationTime: number | null
  userAgent: string
}

export interface PushDevice {
  id: string
  userAgent: string
  createdAt: string
  lastSuccessAt: string | null
}

export interface NotificationSettings {
  tasksDigest: boolean
  /** "HH:MM", the user's local time. */
  tasksDigestAt: string
  englishReminder: boolean
  englishReminderAt: string
}

export const notificationKeys = {
  publicKey: ['notifications', 'public-key'] as const,
  settings: ['notifications', 'settings'] as const,
  devices: ['notifications', 'devices'] as const,
}

/** null: the server has no VAPID keys, so push is not available at all yet. */
export async function fetchPublicKey(): Promise<string | null> {
  const { data } = await api.get<{ publicKey: string | null }>('/notifications/public-key')
  return data.publicKey
}

/** An upsert by endpoint: sending the same subscription again is harmless. */
export async function saveSubscription(dto: PushSubscriptionDto): Promise<void> {
  await api.post('/notifications/subscriptions', dto)
}

/**
 * The token is passed in only on sign-out, where the request has to go out
 * with the session that is being ended (the interceptor reads localStorage,
 * which is already cleared by then).
 */
export async function deleteSubscription(endpoint: string, token?: string): Promise<void> {
  await api.delete('/notifications/subscriptions', {
    data: { endpoint },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
}

export async function fetchDevices(): Promise<PushDevice[]> {
  const { data } = await api.get<PushDevice[]>('/notifications/subscriptions')
  return data
}

export async function fetchSettings(): Promise<NotificationSettings> {
  const { data } = await api.get<NotificationSettings>('/notifications/settings')
  return data
}

export async function updateSettings(patch: Partial<NotificationSettings>): Promise<NotificationSettings> {
  const { data } = await api.patch<NotificationSettings>('/notifications/settings', patch)
  return data
}

/** How many of the user's devices the test reached. */
export async function sendTest(): Promise<number> {
  const { data } = await api.post<{ sent: number }>('/notifications/test')
  return data.sent
}
