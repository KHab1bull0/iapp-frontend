import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// jsdom has no matchMedia; ThemeContext and useMediaQuery read it on mount.
window.matchMedia ??= (query: string) =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList

afterEach(() => cleanup())
