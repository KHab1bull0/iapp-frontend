import { describe, expect, test, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { ToastHost, toast } from './toast'

describe('toast', () => {
  test('can carry an action button, which runs and dismisses the toast', () => {
    const onUndo = vi.fn()
    render(<ToastHost />)
    act(() => toast('Done', 'success', { label: 'Undo', onClick: onUndo }))
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(onUndo).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('Done')).toBeNull()
  })
})
