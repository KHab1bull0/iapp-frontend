import { describe, expect, test } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { PasswordInput } from './PasswordInput'

describe('PasswordInput', () => {
  test('hides the password until the eye is pressed, then hides it again', () => {
    render(<PasswordInput aria-label="Password" defaultValue="secret" />)
    const input = screen.getByLabelText('Password') as HTMLInputElement
    expect(input.type).toBe('password')

    fireEvent.click(screen.getByRole('button', { name: 'Show password' }))
    expect(input.type).toBe('text')
    expect(input.value).toBe('secret')

    fireEvent.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(input.type).toBe('password')
  })

  test('speaks Uzbek', () => {
    localStorage.setItem('iapp-lang', 'uz')
    render(<PasswordInput aria-label="Parol" />)
    expect(screen.getByRole('button', { name: "Parolni ko'rsatish" })).toBeTruthy()
  })
})
