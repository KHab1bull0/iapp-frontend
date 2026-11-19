import { describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { addDaysYmd, formatFullDate, parseApiDate, todayYmd } from '@/core/lib/format'
import { habit } from '@/modules/tasks/test-data'
import { DoneDays } from './DoneDays'

const api = vi.hoisted(() => ({ fetchTaskStats: vi.fn(), markDay: vi.fn(), unmarkDay: vi.fn() }))
vi.mock('@/modules/tasks/api/tasks', async (orig) => ({ ...(await orig<object>()), ...api }))

const today = todayYmd()
// Earlier this month when there is room, so both days are on the first page shown.
const early = today.slice(8) > '02' ? addDaysYmd(today, -1) : today
const cell = (day: string) => screen.getByRole('gridcell', { name: formatFullDate(parseApiDate(day)) })

function renderDays() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <DoneDays task={habit('read')} />
    </QueryClientProvider>,
  )
}

describe('DoneDays', () => {
  test('shows the days done, flips a day with one tap, and keeps days ahead out of reach', async () => {
    api.fetchTaskStats.mockResolvedValue({ total: 1, daily: [{ day: today, count: 1 }] })
    api.markDay.mockResolvedValue(habit('read'))
    api.unmarkDay.mockResolvedValue(habit('read'))
    renderDays()
    await waitFor(() => expect(cell(today).getAttribute('aria-selected')).toBe('true'))

    // Done → not done.
    fireEvent.click(cell(today))
    await waitFor(() => expect(api.unmarkDay).toHaveBeenCalledWith('read', today, today))

    if (early !== today) {
      expect(cell(early).getAttribute('aria-selected')).toBe('false')
      fireEvent.click(cell(early))
      // Shown done at once, while it saves.
      expect(cell(early).getAttribute('aria-selected')).toBe('true')
      await waitFor(() => expect(api.markDay).toHaveBeenCalledWith('read', early, today))
    }

    const tomorrow = addDaysYmd(today, 1)
    if (tomorrow.slice(0, 7) === today.slice(0, 7)) {
      expect((cell(tomorrow) as HTMLButtonElement).disabled).toBe(true)
    }
    expect((screen.getByRole('button', { name: /next month/i }) as HTMLButtonElement).disabled).toBe(true)
  })
})
