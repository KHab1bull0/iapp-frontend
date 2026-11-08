import { describe, expect, test } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { BackButton } from './BackButton'

describe('BackButton', () => {
  test('with no page before it in the app, goes to its fallback', () => {
    render(
      <MemoryRouter initialEntries={['/english/settings/tags']}>
        <Routes>
          <Route path="/english/settings/tags" element={<BackButton fallback="/english" />} />
          <Route path="/english" element={<h1>English</h1>} />
        </Routes>
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByRole('heading', { name: 'English' })).toBeTruthy()
  })
})
