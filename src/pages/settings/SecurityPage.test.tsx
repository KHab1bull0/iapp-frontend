import { describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SecurityPage } from './SecurityPage'

const api = vi.hoisted(() => ({ changePassword: vi.fn() }))
vi.mock('@/core/api/auth', () => api)

describe('SecurityPage', () => {
  test('the submit button is disabled and says so while the change runs', async () => {
    api.changePassword.mockReturnValue(new Promise(() => {}))
    render(
      <MemoryRouter>
        <SecurityPage />
      </MemoryRouter>,
    )
    fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'old-pass' } })
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'new-pass' } })
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'new-pass' } })
    fireEvent.click(screen.getByRole('button', { name: 'Update password' }))

    const saving = (await screen.findByRole('button', { name: 'Saving…' })) as HTMLButtonElement
    expect(saving.disabled).toBe(true)
    expect(api.changePassword).toHaveBeenCalledWith('old-pass', 'new-pass')
  })
})
