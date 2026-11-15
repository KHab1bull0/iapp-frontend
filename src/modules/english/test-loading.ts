import { screen, within } from '@testing-library/react'

/**
 * For the module's tests: the busy region a page shows while it loads, found
 * by its hidden "Loading…" (or another label). Throws when there is none.
 */
export function loadingRegion(label = 'Loading…', container?: HTMLElement): HTMLElement {
  const text = (container ? within(container) : screen).getAllByText(label)[0]
  const region = text.closest<HTMLElement>('[aria-busy="true"]')
  if (!region) throw new Error(`"${label}" is not inside an aria-busy region`)
  return region
}

/** A promise that never settles: a request still running. */
export const pending = <T,>() => new Promise<T>(() => {})
