/**
 * Keeps an installed app from drifting behind the deployed build.
 *
 * vite-plugin-pwa injects a registerSW.js that registers the worker once, on
 * `load`. That is enough for a browser tab, which navigates often, but an app
 * launched from the home screen can stay resident for days: nothing ever asks
 * whether a newer worker exists, so a deploy can sit unnoticed indefinitely.
 *
 * The server side of this is fixed in nginx.conf (sw.js and index.html are
 * served no-cache; before that they were subject to heuristic freshness, so
 * even a check could be answered from a stale HTTP cache). This is the client
 * half: ask on a timer, and ask whenever the app comes back to the foreground,
 * which for a home-screen app is the moment that actually matters.
 *
 * registerType is 'autoUpdate', so a worker found here installs, activates and
 * claims on its own. The current page keeps the bundle it already loaded — no
 * reload is forced, because doing so mid-form would discard a transaction the
 * user is part-way through entering. The new build is live on next launch.
 */

const UPDATE_INTERVAL_MS = 60 * 60 * 1000 // 1h

export function installUpdateCheck(): void {
  if (!('serviceWorker' in navigator)) return

  navigator.serviceWorker.ready
    .then((registration) => {
      const check = () => {
        // update() on a dead connection just rejects and logs noise.
        if (navigator.onLine) void registration.update().catch(() => {})
      }

      setInterval(check, UPDATE_INTERVAL_MS)

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check()
      })
    })
    .catch(() => {
      /* No worker registered (dev, or an unsupported context). Nothing to do. */
    })
}

/**
 * Drops the service worker's cached API responses.
 *
 * NetworkFirst keeps every GET under /api/ in Cache Storage so the app still
 * renders offline. Those are balances and transaction rows, and they outlive
 * the session token in localStorage — on a shared phone the next person to
 * sign in would be one cache read away from the previous user's data.
 */
export async function clearApiCache(): Promise<void> {
  if (typeof caches === 'undefined') return
  try {
    await caches.delete('api-cache')
  } catch {
    /* Non-secure context or storage denied; nothing cached either way. */
  }
}
