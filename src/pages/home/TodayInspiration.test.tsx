import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { todayYmd } from '@/core/lib/format'
import { TodayInspiration } from './TodayInspiration'

const api = vi.hoisted(() => ({ fetchTodayInspiration: vi.fn() }))
vi.mock('@/core/api/inspirations', async (orig) => ({ ...(await orig<object>()), ...api }))

function renderBlock() {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <TodayInspiration />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('TodayInspiration', () => {
  beforeEach(() => {
    api.fetchTodayInspiration.mockReset()
  })

  test("today's own words with their line breaks and kind", async () => {
    api.fetchTodayInspiration.mockResolvedValue({ id: 'i1', text: "Oilam uchun\no'z uyimiz", kind: 'dream', createdAt: '' })
    renderBlock()
    const text = await screen.findByText(/Oilam uchun/)
    expect(text.textContent).toBe("Oilam uchun\no'z uyimiz")
    expect(screen.getByText('Dream')).toBeTruthy()
    expect(api.fetchTodayInspiration).toHaveBeenCalledWith(todayYmd())
  })

  test('with none written, a link to write the first one', async () => {
    api.fetchTodayInspiration.mockResolvedValue(null)
    renderBlock()
    const link = await screen.findByRole('link', { name: /Write your first one/ })
    expect(link.getAttribute('href')).toBe('/settings/inspirations')
  })

  test('holds its place while loading', () => {
    api.fetchTodayInspiration.mockReturnValue(new Promise(() => {}))
    const { container } = renderBlock()
    expect(container.querySelector('[aria-busy="true"]')).toBeTruthy()
  })
})
