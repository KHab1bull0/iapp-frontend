/**
 * Recovery for lazy pages after a deploy.
 *
 * Pages are separate hashed chunks. When a new build goes live, the service
 * worker drops the old chunks from its cache and nginx 404s them, but a page
 * that stayed open (an installed PWA can stay resident for days) still knows
 * only the old names. Opening a page it hasn't loaded yet then fails to import.
 * Reloading picks up the new index.html and its chunk names. This only happens
 * on navigation, never mid-form, so it doesn't conflict with pwa.ts's
 * no-forced-reload rule.
 */

const FLAG = 'iapp-chunk-reload'
/** A second failure this soon after a reload means reloading won't help. */
const RETRY_WINDOW_MS = 30_000

const CHUNK_ERROR_PATTERNS = [
  /Failed to fetch dynamically imported module/i, // Chromium
  /Importing a module script failed/i, // Safari
  /error loading dynamically imported module/i, // Firefox
]

export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return CHUNK_ERROR_PATTERNS.some((p) => p.test(message))
}

/** Reloads unless it already did so moments ago. Returns whether it reloaded. */
export function reloadOnce(reload: () => void = () => window.location.reload()): boolean {
  let last = 0
  try {
    last = Number(sessionStorage.getItem(FLAG)) || 0
  } catch {
    /* storage blocked: fall through and reload */
  }
  if (Date.now() - last < RETRY_WINDOW_MS) return false
  try {
    sessionStorage.setItem(FLAG, String(Date.now()))
  } catch {
    /* ignore */
  }
  reload()
  return true
}
