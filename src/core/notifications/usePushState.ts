import { useCallback, useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchPublicKey, notificationKeys } from './api'
import { detectBlocker, getSubscription, subscribeDevice, unsubscribeDevice, type PushState } from './push'

interface DeviceSnapshot {
  permission: NotificationPermission
  subscribed: boolean
}

async function readDevice(): Promise<DeviceSnapshot> {
  const subscription = await getSubscription().catch(() => null)
  return { permission: Notification.permission, subscribed: subscription !== null }
}

/** This device's push state, and the two things the user can do about it. */
export function usePushState() {
  const qc = useQueryClient()
  // Platform facts: they cannot change while the page is open.
  const [blocker] = useState(detectBlocker)
  const publicKey = useQuery({
    queryKey: notificationKeys.publicKey,
    queryFn: fetchPublicKey,
    enabled: blocker === null,
    staleTime: Infinity,
  })
  const [device, setDevice] = useState<DeviceSnapshot | null>(null)
  const [busy, setBusy] = useState(false)

  // Permission can be changed in the browser's or phone's settings while the
  // app is in the background, so look again whenever it comes back.
  useEffect(() => {
    if (blocker) return
    let alive = true
    const read = () => void readDevice().then((d) => alive && setDevice(d))
    read()
    const onVisible = () => document.visibilityState === 'visible' && read()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      alive = false
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [blocker])

  let state: PushState
  if (blocker) state = blocker
  else if (publicKey.isError) state = 'error'
  else if (publicKey.isPending || !device) state = 'loading'
  else if (!publicKey.data) state = 'not-configured'
  else if (device.permission === 'denied') state = 'denied'
  // A subscription left over after permission was reset delivers nothing.
  else if (device.subscribed && device.permission === 'granted') state = 'on'
  else state = 'off'

  /**
   * Call straight from a click. requestPermission() comes first, before any
   * await: Safari only shows the prompt inside the user's own gesture.
   */
  const enable = useCallback(async (): Promise<NotificationPermission> => {
    const key = publicKey.data
    if (!key) return 'default'
    const asking = Notification.requestPermission()
    setBusy(true)
    try {
      const permission = await asking
      if (permission !== 'granted') {
        setDevice({ permission, subscribed: false })
        return permission
      }
      await subscribeDevice(key)
      setDevice({ permission, subscribed: true })
      void qc.invalidateQueries({ queryKey: notificationKeys.devices })
      return permission
    } finally {
      setBusy(false)
    }
  }, [publicKey.data, qc])

  const disable = useCallback(async () => {
    setBusy(true)
    try {
      await unsubscribeDevice()
      setDevice({ permission: Notification.permission, subscribed: false })
      void qc.invalidateQueries({ queryKey: notificationKeys.devices })
    } finally {
      setBusy(false)
    }
  }, [qc])

  return { state, busy, enable, disable, retry: publicKey.refetch }
}
