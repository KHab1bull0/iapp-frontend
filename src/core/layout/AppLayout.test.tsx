import { describe, expect, test } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '@/core/contexts/ThemeContext'
import { AuthProvider } from '@/core/contexts/AuthContext'
import { finance } from '@/modules/finance/manifest'
import { MobileFilterProvider } from '@/modules/finance/MobileFilterContext'
import { AppLayout } from './AppLayout'

function renderShell(path: string) {
  return render(
    <ThemeProvider>
      <QueryClientProvider client={new QueryClient()}>
        <MobileFilterProvider>
          <AuthProvider>
            <MemoryRouter initialEntries={[path]}>
              <Routes>
                <Route path="*" element={<AppLayout modules={[finance]} />} />
              </Routes>
            </MemoryRouter>
          </AuthProvider>
        </MobileFilterProvider>
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
    ])
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

  test('no module tabs on settings', () => {
    renderShell('/settings')
    expect(screen.queryByRole('navigation', { name: 'Finance pages' })).toBeNull()
  })

  test('the FAB goes straight to adding a transaction', () => {
    renderShell('/')
    expect(screen.getByRole('button', { name: 'Add transaction' })).toBeTruthy()
  })
})
