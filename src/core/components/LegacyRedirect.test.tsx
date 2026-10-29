import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { LegacyRedirect } from './LegacyRedirect'

function Where() {
  const { pathname, search } = useLocation()
  return <p>at {pathname + search}</p>
}

describe('LegacyRedirect', () => {
  test('an old edit link from an installed PWA opens the same transaction', () => {
    render(
      <MemoryRouter initialEntries={['/transactions/abc-123/edit?x=1']}>
        <Routes>
          <Route path="transactions/*" element={<LegacyRedirect />} />
          <Route path="*" element={<Where />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('at /finance/transactions/abc-123/edit?x=1')).toBeTruthy()
  })
})
