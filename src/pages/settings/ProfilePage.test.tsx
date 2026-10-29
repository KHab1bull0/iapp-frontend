import { beforeEach, describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/core/contexts/AuthContext'
import { fakeToken } from '@/test/jwt'
import { ProfilePage } from './ProfilePage'

const api = vi.hoisted(() => ({
  fetchProfile: vi.fn(),
  updateProfile: vi.fn(),
}))
vi.mock('@/core/api/profile', () => api)

function renderPage() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthProvider>
        <MemoryRouter>
          <ProfilePage />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  )
}

describe('ProfilePage', () => {
  beforeEach(() => {
    localStorage.setItem('token', fakeToken('u1', 'bobby'))
    api.fetchProfile.mockResolvedValue({
      id: 'u1',
      username: 'bobby',
      displayName: null,
      createdAt: '2026-05-18T10:00:00.000Z',
    })
    api.updateProfile.mockImplementation(async ({ displayName }: { displayName: string }) => ({
      id: 'u1',
      username: 'bobby',
      displayName: displayName.trim() || null,
      createdAt: '2026-05-18T10:00:00.000Z',
    }))
  })

  test('shows the username as read-only', async () => {
    renderPage()
    const username = await screen.findByLabelText('Username')
    expect((username as HTMLInputElement).value).toBe('bobby')
    expect((username as HTMLInputElement).readOnly).toBe(true)
  })

  test('saves a new display name', async () => {
    renderPage()
    const name = (await screen.findByLabelText('Display name')) as HTMLInputElement
    await waitFor(() => expect(name.disabled).toBe(false))
    fireEvent.change(name, { target: { value: 'Habibullo' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(api.updateProfile).toHaveBeenCalledWith({ displayName: 'Habibullo' }))
  })

  test('the name field waits for the saved profile, so typing is never overwritten', async () => {
    api.fetchProfile.mockReturnValue(new Promise(() => {}))
    renderPage()
    const name = (await screen.findByLabelText('Display name')) as HTMLInputElement
    expect(name.disabled).toBe(true)
  })

  test('Save stays disabled until the name changes', async () => {
    renderPage()
    await screen.findByLabelText('Display name')
    expect((screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(true)
  })
})
