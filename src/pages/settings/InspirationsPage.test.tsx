import { beforeEach, describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { InspirationsPage } from './InspirationsPage'

const api = vi.hoisted(() => ({
  fetchInspirations: vi.fn(),
  createInspiration: vi.fn(),
  updateInspiration: vi.fn(),
  deleteInspiration: vi.fn(),
  fetchTodayInspiration: vi.fn(),
}))
vi.mock('@/core/api/inspirations', async (orig) => ({ ...(await orig<object>()), ...api }))

const HOME = { id: 'i1', text: "Oilam uchun\no'z uyimiz", kind: 'dream' as const, createdAt: '' }

function renderPage() {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <InspirationsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('InspirationsPage', () => {
  beforeEach(() => {
    for (const fn of Object.values(api)) fn.mockReset()
    api.fetchInspirations.mockResolvedValue([HOME])
  })

  test('lists entries with their own line breaks and kind', async () => {
    renderPage()
    const item = await screen.findByRole('listitem')
    const text = within(item).getByText(/Oilam uchun/)
    expect(text.textContent).toBe("Oilam uchun\no'z uyimiz")
    expect(text.className).toMatch(/text/)
    expect(within(item).getByText('Dream')).toBeTruthy()
  })

  test('with none, says what it is for', async () => {
    api.fetchInspirations.mockResolvedValue([])
    renderPage()
    expect(await screen.findByText(/Nothing here yet/)).toBeTruthy()
  })

  test('adds an entry as written: Enter is a new line, Add saves', async () => {
    api.createInspiration.mockResolvedValue({ ...HOME, id: 'i2' })
    renderPage()
    await screen.findByRole('listitem')
    const field = screen.getByRole('textbox', { name: 'New entry' })
    fireEvent.change(field, { target: { value: 'Birinchi\nIkkinchi' } })
    fireEvent.keyDown(field, { key: 'Enter' })
    expect(api.createInspiration).not.toHaveBeenCalled()
    fireEvent.click(within(screen.getByRole('group', { name: 'Kind' })).getByRole('button', { name: 'Goal' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    await waitFor(() =>
      expect(api.createInspiration).toHaveBeenCalledWith({ text: 'Birinchi\nIkkinchi', kind: 'goal' }),
    )
  })

  test('edits an entry, and Cancel leaves it as it was', async () => {
    api.updateInspiration.mockResolvedValue(HOME)
    renderPage()
    const item = await screen.findByRole('listitem')
    fireEvent.click(within(item).getByRole('button', { name: 'Edit' }))
    const field = within(item).getByRole('textbox') as HTMLTextAreaElement
    expect(field.value).toBe("Oilam uchun\no'z uyimiz")
    fireEvent.click(within(item).getByRole('button', { name: 'Cancel' }))
    expect(api.updateInspiration).not.toHaveBeenCalled()

    fireEvent.click(within(item).getByRole('button', { name: 'Edit' }))
    fireEvent.change(within(item).getByRole('textbox'), { target: { value: 'Yangi\nmatn' } })
    fireEvent.click(within(item).getByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(api.updateInspiration).toHaveBeenCalledWith('i1', { text: 'Yangi\nmatn', kind: 'dream' }),
    )
  })

  test('deletes only after confirming', async () => {
    api.deleteInspiration.mockResolvedValue(undefined)
    renderPage()
    const item = await screen.findByRole('listitem')
    fireEvent.click(within(item).getByRole('button', { name: 'Delete' }))
    const dialog = await screen.findByRole('alertdialog')
    expect(api.deleteInspiration).not.toHaveBeenCalled()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(api.deleteInspiration).toHaveBeenCalledWith('i1'))
  })
})
