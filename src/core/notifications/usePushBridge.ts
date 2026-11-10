import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/core/contexts/AuthContext'
import { resyncSubscription } from './push'

// Per page load and user: AppLayout remounts (StrictMode, sign-out and back
// in) and each remount would otherwise post the subscription again.
const synced = new Set<string>()

/**
 * The app's half of push, mounted once in the signed-in shell: keeps the
 * server's copy of this device's subscription current, and opens the page a
 * tapped notification points to (public/push-sw.js posts it here).
 */
export function usePushBridge() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const userId = user?.id

  useEffect(() => {
    if (!userId || synced.has(userId) || !('serviceWorker' in navigator)) return
    synced.add(userId)
    // Offline or a server hiccup: the next launch tries again.
    void resyncSubscription().catch(() => synced.delete(userId))
  }, [userId])

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; url?: string } | null
      if (data?.type !== 'iapp:navigate' || typeof data.url !== 'string') return
      const url = new URL(data.url, window.location.origin)
      if (url.origin !== window.location.origin) return
      navigate(url.pathname + url.search + url.hash)
    }
    navigator.serviceWorker.addEventListener('message', onMessage)
    return () => navigator.serviceWorker.removeEventListener('message', onMessage)
  }, [navigate])
}
