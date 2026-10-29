import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { ThemeProvider, useTheme } from './ThemeContext'

function Probe() {
  const { theme, preference, setPreference } = useTheme()
  return (
    <>
      <p>
        {preference}:{theme}
      </p>
      <button onClick={() => setPreference('light')}>light</button>
    </>
  )
}

const realMatchMedia = window.matchMedia

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear()
    // The device asks for dark.
    window.matchMedia = ((query: string) =>
      ({ ...realMatchMedia(query), matches: query.includes('dark') }) as MediaQueryList)
  })
  afterEach(() => {
    window.matchMedia = realMatchMedia
  })

  test('"system" follows the device setting', () => {
    localStorage.setItem('ft-theme', 'system')
    render(<ThemeProvider><Probe /></ThemeProvider>)
    expect(screen.getByText('system:dark')).toBeTruthy()
  })

  test('with nothing saved the preference is system', () => {
    render(<ThemeProvider><Probe /></ThemeProvider>)
    expect(screen.getByText('system:dark')).toBeTruthy()
  })

  test('an explicit choice wins over the device and is saved', () => {
    render(<ThemeProvider><Probe /></ThemeProvider>)
    act(() => screen.getByText('light').click())
    expect(screen.getByText('light:light')).toBeTruthy()
    expect(localStorage.getItem('ft-theme')).toBe('light')
  })
})
