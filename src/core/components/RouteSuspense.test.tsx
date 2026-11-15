import { lazy, type ComponentType } from 'react'
import { describe, expect, test } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import { RouteSuspense } from './RouteSuspense'

/** A lazy page whose code arrives only when the test says so. */
function deferredPage(text: string) {
  let resolve!: (m: { default: ComponentType }) => void
  const Page = lazy(() => new Promise<{ default: ComponentType }>((r) => (resolve = r)))
  return { Page, arrive: () => act(async () => resolve({ default: () => <h1>{text}</h1> })) }
}

describe('RouteSuspense', () => {
  test('shows the page skeleton and the top bar while a lazy page is pending, then the page', async () => {
    const { Page, arrive } = deferredPage('Stats')
    const { container } = render(
      <MemoryRouter initialEntries={['/stats']}>
        <Routes>
          <Route element={<RouteSuspense />}>
            <Route path="stats" element={<Page />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
    const busy = container.querySelector('[aria-busy="true"]')
    expect(busy).not.toBeNull()
    expect(busy!.textContent).toContain('Loading…')
    expect(container.querySelector('[data-top-progress]')).not.toBeNull()

    await arrive()
    expect(screen.getByRole('heading', { name: 'Stats' })).toBeTruthy()
    expect(container.querySelector('[aria-busy="true"]')).toBeNull()
    expect(container.querySelector('[data-top-progress]')).toBeNull()
  })

  test('a tap on a link to a page not loaded yet answers with the fallback, not the old page frozen', async () => {
    const { Page, arrive } = deferredPage('Later')
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<RouteSuspense />}>
            <Route index element={<Link to="/later">Go</Link>} />
            <Route path="later" element={<Page />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
    await act(async () => fireEvent.click(screen.getByRole('link', { name: 'Go' })))
    expect(screen.queryByRole('link', { name: 'Go' })).toBeNull()
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
    await arrive()
    expect(screen.getByRole('heading', { name: 'Later' })).toBeTruthy()
  })

  test('the Uzbek label is read out in Uzbek', () => {
    localStorage.setItem('iapp-lang', 'uz')
    const { Page } = deferredPage('x')
    const { container } = render(
      <MemoryRouter>
        <Routes>
          <Route element={<RouteSuspense />}>
            <Route index element={<Page />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
    expect(container.querySelector('[aria-busy="true"]')!.textContent).toContain('Yuklanmoqda…')
  })
})
