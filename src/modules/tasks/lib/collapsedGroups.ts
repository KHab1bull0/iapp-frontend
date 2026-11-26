const KEY = 'iapp-today-collapsed'

/** Today's groups folded on this device ('none' for the ungrouped part). */
export function loadCollapsed(): string[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function saveCollapsed(keys: string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(keys))
  } catch {
    // Private mode or full storage: folding still works for this visit.
  }
}
