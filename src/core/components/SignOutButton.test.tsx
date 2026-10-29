import { describe, expect, test } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { AuthProvider } from '@/core/contexts/AuthContext'
import { fakeToken } from '@/test/jwt'
import { SignOutButton } from './SignOutButton'

describe('SignOutButton', () => {
  test('asks for confirmation before signing out', async () => {
    localStorage.setItem('token', fakeToken('u1', 'bobby'))
    render(
      <AuthProvider>
        <SignOutButton />
      </AuthProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))
    expect(localStorage.getItem('token')).not.toBeNull()

    const dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Sign out' }))
    expect(localStorage.getItem('token')).toBeNull()
  })
})
