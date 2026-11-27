import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { FinanceSettingsIndex } from './FinanceSettingsIndex'

const mobile = vi.hoisted(() => ({ value: true }))
vi.mock('@/core/hooks/useMediaQuery', async (orig) => ({
  ...(await orig<object>()),
  useIsMobile: () => mobile.value,
}))

function renderAt() {
  return render(
    <MemoryRouter initialEntries={['/finance/settings']}>
      <Routes>
        <Route path="/finance/settings" element={<FinanceSettingsIndex />} />
        <Route path="/finance/settings/categories" element={<p>Categories page</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('FinanceSettingsIndex', () => {
  test('a phone gets the list of sections, each its own page', () => {
    mobile.value = true
    renderAt()
    expect(screen.getByRole('heading', { name: 'Finance settings' })).toBeTruthy()
    expect(screen.getByRole('link', { name: /Categories/ }).getAttribute('href')).toBe('/finance/settings/categories')
    expect(screen.getByRole('link', { name: /Dollar rate/ }).getAttribute('href')).toBe('/finance/settings/rate')
  })

  test('desktop opens the first section (the list is on the left)', () => {
    mobile.value = false
    renderAt()
    expect(screen.getByText('Categories page')).toBeTruthy()
  })
})
