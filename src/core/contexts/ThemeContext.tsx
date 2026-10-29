import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

type Theme = 'light' | 'dark'
export type ThemePreference = Theme | 'system'

interface ThemeContextValue {
  /** What is on screen. */
  theme: Theme
  /** What the user chose; 'system' follows the device. */
  preference: ThemePreference
  setPreference: (p: ThemePreference) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  preference: 'system',
  setPreference: () => {},
  toggleTheme: () => {},
})

const DARK_QUERY = '(prefers-color-scheme: dark)'

/** Mirrors the pre-paint bootstrap script in index.html — keep the two in sync. */
function initialPreference(): ThemePreference {
  try {
    const saved = localStorage.getItem('ft-theme')
    return saved === 'light' || saved === 'dark' ? saved : 'system'
  } catch {
    return 'system'
  }
}

function systemTheme(): Theme {
  try {
    return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

// --bg for each theme. The browser chrome colour has to be updated imperatively
// because the <meta> tags are static and media-query based.
const CHROME_COLOR: Record<Theme, string> = {
  light: '#F8FAFC',
  dark:  '#0F1117',
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(initialPreference)
  const [system, setSystem] = useState<Theme>(systemTheme)
  const theme = preference === 'system' ? system : preference

  // Follow the device while the preference is 'system'.
  useEffect(() => {
    if (preference !== 'system') return
    const mql = window.matchMedia(DARK_QUERY)
    const onChange = (e: MediaQueryListEvent) => setSystem(e.matches ? 'dark' : 'light')
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [preference])

  useEffect(() => {
    // Anything but light/dark reads as "system" in index.html's bootstrap.
    localStorage.setItem('ft-theme', preference)
  }, [preference])

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('theme-light', 'theme-dark')
    root.classList.add('theme-' + theme)

    document
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((m) => m.setAttribute('content', CHROME_COLOR[theme]))
  }, [theme])

  const toggleTheme = () => setPreference(theme === 'light' ? 'dark' : 'light')

  return (
    <ThemeContext.Provider value={{ theme, preference, setPreference, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
