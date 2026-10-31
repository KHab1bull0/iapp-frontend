import { describe, expect, test } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LanguageProvider } from '@/core/i18n'
import { PreferencesPage } from './PreferencesPage'

describe('PreferencesPage', () => {
  test('switching to Uzbek changes the page at once and is remembered', () => {
    render(
      <LanguageProvider>
        <MemoryRouter>
          <PreferencesPage />
        </MemoryRouter>
      </LanguageProvider>,
    )
    expect(screen.getByRole('heading', { name: 'Preferences' })).toBeTruthy()
    fireEvent.click(screen.getByRole('radio', { name: "O'zbekcha" }))
    expect(screen.getByRole('heading', { name: 'Afzalliklar' })).toBeTruthy()
    expect(screen.getByText('Ilova tili')).toBeTruthy()
    expect(localStorage.getItem('iapp-lang')).toBe('uz')
  })
})
