import { afterEach, beforeEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { setFormatLang } from '@/core/lib/format'

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

// Tests read English copy unless they switch to Uzbek (the app's default) themselves.
beforeEach(() => {
  localStorage.setItem('iapp-lang', 'en')
  setFormatLang('en')
})

afterEach(() => cleanup())
