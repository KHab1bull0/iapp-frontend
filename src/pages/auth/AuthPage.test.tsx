import { describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/core/contexts/AuthContext'
import { AuthPage } from './AuthPage'

const http = vi.hoisted(() => ({ post: vi.fn() }))
vi.mock('@/core/api/axios', () => ({ default: http }))

describe('AuthPage', () => {
  test('Sign in is disabled and says so while the request runs', async () => {
    http.post.mockReturnValue(new Promise(() => {}))
    render(
      <AuthProvider>
        <MemoryRouter>
          <AuthPage />
        </MemoryRouter>
      </AuthProvider>,
    )
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'bobby' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } })
    fireEvent.submit(screen.getByLabelText('Username').closest('form')!)

    const wait = (await screen.findByRole('button', { name: 'Please wait…' })) as HTMLButtonElement
    expect(wait.disabled).toBe(true)
    expect(http.post).toHaveBeenCalledWith('/auth/login', { username: 'bobby', password: 'secret' })
  })
})
