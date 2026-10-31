import { describe, expect, test } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '@/core/contexts/ThemeContext'
import { AuthProvider } from '@/core/contexts/AuthContext'
import { finance } from '@/modules/finance/manifest'
import { AppLayout } from './AppLayout'

function renderShell(path: string) {
  return render(
    <ThemeProvider>
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider>
          <MemoryRouter initialEntries={[path]}>
            <Routes>
              <Route path="*" element={<AppLayout modules={[finance]} />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>,
  )
}

const linkTargets = (root: HTMLElement) =>
  within(root).getAllByRole('link').map((a) => a.getAttribute('href'))

describe('AppLayout driven by the registry', () => {
  test('sidebar lists Home, the finance pages and Settings', () => {
    const { container } = renderShell('/finance')
    expect(linkTargets(container.querySelector('aside')!)).toEqual([
      '/',
      '/finance',
      '/finance/transactions',
      '/settings',
      '/settings/profile', // the user block
    ])
  })

  test("finance's first page is called Statistics", () => {
    const { container } = renderShell('/finance')
    const aside = container.querySelector('aside')!
    expect(within(aside).getByRole('link', { name: 'Statistics' }).getAttribute('href')).toBe('/finance')
    expect(within(aside).queryByText('Overview')).toBeNull()
  })

  test('bottom nav has Home, Finance and Settings', () => {
    renderShell('/finance')
    const navs = screen.getAllByRole('navigation')
    const bottom = navs[navs.length - 1]
    expect(linkTargets(bottom)).toEqual(['/', '/finance', '/settings'])
  })

  test('module tabs show inside finance and not elsewhere', () => {
    renderShell('/finance/transactions')
    expect(screen.getByRole('navigation', { name: 'Finance pages' })).toBeTruthy()
  })

  test("finance settings is reached from Settings, so it shows no finance tabs", () => {
    renderShell('/finance/settings')
    expect(screen.queryByRole('navigation', { name: 'Finance pages' })).toBeNull()
  })

  test('in Uzbek the navigation reads Uzbek', () => {
    localStorage.setItem('iapp-lang', 'uz')
    renderShell('/finance')
    const aside = document.querySelector('aside')!
    expect(within(aside).getByRole('link', { name: 'Bosh sahifa' })).toBeTruthy()
    expect(within(aside).getByRole('link', { name: 'Sozlamalar' })).toBeTruthy()
  })

  test('there is no top header bar', () => {
    renderShell('/finance')
    expect(screen.queryByRole('banner')).toBeNull()
  })

  test('no module tabs on settings', () => {
    renderShell('/settings')
    expect(screen.queryByRole('navigation', { name: 'Finance pages' })).toBeNull()
  })

  test('the shell shows no add button: finance keeps its own on the transactions page', () => {
    renderShell('/')
    expect(screen.queryByRole('button', { name: 'Add transaction' })).toBeNull()
    renderShell('/finance')
    expect(screen.queryByRole('button', { name: 'Add transaction' })).toBeNull()
  })
})
