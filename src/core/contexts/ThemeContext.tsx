import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggleTheme: () => {},
})

/** Mirrors the pre-paint bootstrap script in index.html — keep the two in sync. */
function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem('ft-theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
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
  const [theme, setTheme] = useState<Theme>(initialTheme)

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('theme-light', 'theme-dark')
    root.classList.add('theme-' + theme)
    localStorage.setItem('ft-theme', theme)

    document
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((m) => m.setAttribute('content', CHROME_COLOR[theme]))
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'))

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
