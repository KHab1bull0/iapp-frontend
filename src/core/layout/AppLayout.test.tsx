import { describe, expect, test } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
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
              <Route path="/finance/transactions/new" element={<h1>Add page</h1>} />
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
      '/settings', // the user block is the one way to Settings
    ])
  })

  test('the sidebar has no theme switch or sign-out: both live in Settings', () => {
    const { container } = renderShell('/finance')
    const aside = container.querySelector('aside')!
    expect(within(aside).queryByRole('button', { name: /mode|Sign out/i })).toBeNull()
  })

  test('folded, the sidebar keeps its toggle (so it can be opened again) and remembers', () => {
    const { container, unmount } = renderShell('/finance')
    const aside = () => container.querySelector('aside')!
    fireEvent.click(within(aside()).getByRole('button', { name: 'Collapse sidebar' }))
    expect(within(aside()).getByRole('button', { name: 'Expand sidebar' })).toBeTruthy()
    // Icons keep a name to read out once their labels are gone.
    expect(within(aside()).getByRole('link', { name: 'Transactions' })).toBeTruthy()
    unmount()
    const again = renderShell('/finance')
    expect(within(again.container.querySelector('aside')!).getByRole('button', { name: 'Expand sidebar' })).toBeTruthy()
    localStorage.removeItem('iapp-sidebar-collapsed')
  })

  test("finance's first page is called Stats", () => {
    const { container } = renderShell('/finance')
    const aside = container.querySelector('aside')!
    expect(within(aside).getByRole('link', { name: 'Stats' }).getAttribute('href')).toBe('/finance')
    expect(within(aside).queryByText('Overview')).toBeNull()
  })

  test('outside a module the bottom nav has Home and Finance; Settings is not a tab; "+" only on Home', () => {
    const settings = renderShell('/settings')
    const bottom = screen.getByRole('navigation', { name: 'Main menu' })
    expect(linkTargets(bottom)).toEqual(['/', '/finance'])
    expect(screen.queryByRole('button', { name: 'Add' })).toBeNull()
    settings.unmount()
    renderShell('/')
    expect(screen.getByRole('button', { name: 'Add' })).toBeTruthy()
  })

  test("inside a module the bottom nav swaps the modules for its pages and gear; no tabs on top", () => {
    renderShell('/finance/transactions')
    const bottom = screen.getByRole('navigation', { name: 'Finance pages' })
    expect(linkTargets(bottom)).toEqual(['/', '/finance', '/finance/transactions', '/finance/settings'])
    expect(screen.getByRole('button', { name: 'Add' })).toBeTruthy()
    expect(within(bottom).getByRole('link', { name: 'Transactions' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getAllByRole('navigation', { name: 'Finance pages' })).toHaveLength(1)
  })

  test('on a phone "+" opens the add page instead', () => {
    const desktop = window.matchMedia
    window.matchMedia = ((q: string) => ({ ...desktop(q), matches: true })) as typeof window.matchMedia
    try {
      renderShell('/finance/transactions')
      fireEvent.click(screen.getByRole('button', { name: 'Add' }))
      expect(screen.getByRole('heading', { name: 'Add page' })).toBeTruthy()
    } finally {
      window.matchMedia = desktop
    }
  })

  test('on desktop "+" opens the add panel straight away when there is only one thing to add', () => {
    renderShell('/finance/transactions')
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(screen.getByRole('dialog', { name: 'Add transaction' })).toBeTruthy()
  })

  test('the sidebar has an Add button on Home, and a command search everywhere', () => {
    const { container } = renderShell('/')
    const aside = container.querySelector('aside')!
    expect(within(aside).getByRole('button', { name: /Add/ })).toBeTruthy()
    expect(within(aside).getByRole('button', { name: /^Commands/ })).toBeTruthy()
  })

  test("the module's gear to its settings stays in the bottom nav on that page", () => {
    renderShell('/finance/settings')
    const tabs = screen.getByRole('navigation', { name: 'Finance pages' })
    const gear = within(tabs).getByRole('link', { name: 'Settings' })
    expect(gear.getAttribute('href')).toBe('/finance/settings')
    expect(gear.getAttribute('aria-current')).toBe('page')
  })

  test('in Uzbek the navigation reads Uzbek', () => {
    localStorage.setItem('iapp-lang', 'uz')
    renderShell('/finance')
    const aside = document.querySelector('aside')!
    expect(within(aside).getByRole('link', { name: 'Hisobot' })).toBeTruthy()
    expect(within(aside).getByRole('link', { name: /^Sozlamalar/ })).toBeTruthy()
  })

  test('module pages get a desktop top bar: module, page title and the module\'s Add', () => {
    renderShell('/finance/transactions')
    const bar = screen.getByRole('banner')
    expect(within(bar).getByText('Finance')).toBeTruthy()
    expect(within(bar).getByRole('heading', { name: 'Transactions' })).toBeTruthy()
    expect(within(bar).getByRole('button', { name: /Transaction/ })).toBeTruthy()
    expect(within(bar).getByRole('button', { name: 'Keyboard shortcuts' })).toBeTruthy()
  })

  test('pages outside a module have no top bar (phones never show it: CSS)', () => {
    renderShell('/settings')
    expect(screen.queryByRole('banner')).toBeNull()
  })

  test('"?" lists the keyboard shortcuts', () => {
    renderShell('/finance')
    fireEvent.keyDown(document.body, { key: '?' })
    expect(screen.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeTruthy()
  })

  test("no module's pages in the bottom nav on settings", () => {
    renderShell('/settings')
    expect(screen.queryByRole('navigation', { name: 'Finance pages' })).toBeNull()
  })

  test('pages draw no add button of their own: "+" in the shell is the one way', () => {
    renderShell('/finance/transactions')
    expect(screen.queryByRole('button', { name: 'Add transaction' })).toBeNull()
  })

  test('the global add is on Home only: not in the sidebar or the bottom bar elsewhere', () => {
    const home = renderShell('/')
    expect(within(home.container.querySelector('aside')!).getByRole('button', { name: /Add/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Add' })).toBeTruthy() // the bottom bar's
    home.unmount()
    for (const path of ['/settings', '/finance', '/finance/settings']) {
      const { container, unmount } = renderShell(path)
      expect(within(container.querySelector('aside')!).queryByRole('button', { name: /Add/ })).toBeNull()
      expect(screen.queryByRole('button', { name: 'Add' })).toBeNull()
      unmount()
    }
  })

  test('inside a module, "+" shows only on the page that adds, in the sidebar never', () => {
    const { container } = renderShell('/finance/transactions')
    expect(within(container.querySelector('aside')!).queryByRole('button', { name: /Add/ })).toBeNull()
    expect(screen.getAllByRole('button', { name: /Add|Transaction/ }).length).toBeGreaterThan(0)
  })

  test('"N" adds only where "+" is', () => {
    const away = renderShell('/finance')
    fireEvent.keyDown(document.body, { key: 'n' })
    expect(screen.queryByRole('dialog', { name: 'Add transaction' })).toBeNull()
    away.unmount()
    renderShell('/finance/transactions')
    fireEvent.keyDown(document.body, { key: 'n' })
    expect(screen.getByRole('dialog', { name: 'Add transaction' })).toBeTruthy()
  })
})
