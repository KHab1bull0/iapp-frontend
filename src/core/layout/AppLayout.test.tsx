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

  test('bottom nav has Today, "+" and Finance; Settings is not a tab', () => {
    renderShell('/finance')
    const navs = screen.getAllByRole('navigation')
    const bottom = navs[navs.length - 1]
    expect(linkTargets(bottom)).toEqual(['/', '/finance'])
    expect(within(bottom).getByRole('button', { name: 'Add' })).toBeTruthy()
  })

  test('on a phone "+" opens the add page instead', () => {
    const desktop = window.matchMedia
    window.matchMedia = ((q: string) => ({ ...desktop(q), matches: true })) as typeof window.matchMedia
    try {
      renderShell('/finance')
      const navs = screen.getAllByRole('navigation')
      fireEvent.click(within(navs[navs.length - 1]).getByRole('button', { name: 'Add' }))
      expect(screen.getByRole('heading', { name: 'Add page' })).toBeTruthy()
    } finally {
      window.matchMedia = desktop
    }
  })

  test('on desktop "+" opens the add panel straight away when there is only one thing to add', () => {
    renderShell('/finance')
    const navs = screen.getAllByRole('navigation')
    fireEvent.click(within(navs[navs.length - 1]).getByRole('button', { name: 'Add' }))
    expect(screen.getByRole('dialog', { name: 'Add transaction' })).toBeTruthy()
  })

  test('the sidebar has an Add button and a command search', () => {
    const { container } = renderShell('/finance')
    const aside = container.querySelector('aside')!
    expect(within(aside).getByRole('button', { name: /Add/ })).toBeTruthy()
    expect(within(aside).getByRole('button', { name: /^Commands/ })).toBeTruthy()
  })

  test('module tabs show inside finance and not elsewhere', () => {
    renderShell('/finance/transactions')
    expect(screen.getByRole('navigation', { name: 'Finance pages' })).toBeTruthy()
  })

  test("the module's tabs end with a gear to its settings, and stay on that page", () => {
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

  test('no module tabs on settings', () => {
    renderShell('/settings')
    expect(screen.queryByRole('navigation', { name: 'Finance pages' })).toBeNull()
  })

  test('pages draw no add button of their own: "+" in the shell is the one way', () => {
    renderShell('/finance/transactions')
    expect(screen.queryByRole('button', { name: 'Add transaction' })).toBeNull()
  })
})
