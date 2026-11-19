import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import api from '@/core/api/axios'
import { AuthProvider, useAuth } from './AuthContext'

vi.mock('@/core/lib/pwa', () => ({ clearApiCache: vi.fn() }))
vi.mock('@/core/notifications/push', () => ({ forgetDevicePush: vi.fn() }))

// A token that parses and has not expired.
const TOKEN = `x.${btoa(JSON.stringify({ sub: 'u1', username: 'demo', exp: Date.now() / 1000 + 3600 }))}.y`

const status = (code: number): AxiosAdapter => (config: InternalAxiosRequestConfig) =>
  Promise.reject(
    new AxiosError('fail', String(code), config, null, {
      status: code, statusText: '', headers: {}, config, data: {},
    }),
  )

function Who() {
  const { isAuthenticated } = useAuth()
  return <span>{isAuthenticated ? 'in' : 'out'}</span>
}

describe('AuthProvider', () => {
  const adapter = api.defaults.adapter
  beforeEach(() => localStorage.setItem('token', TOKEN))
  afterEach(() => {
    api.defaults.adapter = adapter
    localStorage.clear()
  })

  test('a refused session (401) signs out', async () => {
    render(<AuthProvider><Who /></AuthProvider>)
    expect(screen.getByText('in')).toBeTruthy()
    api.defaults.adapter = status(401)
    await expect(api.get('/tasks/today')).rejects.toBeTruthy()
    await waitFor(() => expect(screen.getByText('out')).toBeTruthy())
    expect(localStorage.getItem('token')).toBeNull()
  })

  test('a wrong password (401 from /auth) or another error keeps the session', async () => {
    render(<AuthProvider><Who /></AuthProvider>)
    api.defaults.adapter = status(401)
    await expect(api.patch('/auth/change-password')).rejects.toBeTruthy()
    api.defaults.adapter = status(500)
    await expect(api.get('/tasks/today')).rejects.toBeTruthy()
    expect(screen.getByText('in')).toBeTruthy()
    expect(localStorage.getItem('token')).toBe(TOKEN)
  })
})
