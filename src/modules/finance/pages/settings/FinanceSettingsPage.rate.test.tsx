import { beforeEach, describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { fetchBankUsdRate, fetchFinanceSettings, updateFinanceSettings } from '@/modules/finance/api/rates'
import { todayYmd } from '@/core/lib/format'
import { FinanceSettingsPage } from './FinanceSettingsPage'

vi.mock('@/modules/finance/api/categories', async (orig) => ({
  ...(await orig<object>()),
  fetchCategories: vi.fn().mockResolvedValue([]),
}))
vi.mock('@/modules/finance/api/categoryParents', async (orig) => ({
  ...(await orig<object>()),
  fetchCategoryParents: vi.fn().mockResolvedValue([]),
}))
vi.mock('@/modules/finance/api/rates', async (orig) => ({
  ...(await orig<object>()),
  fetchBankUsdRate: vi.fn(),
  fetchFinanceSettings: vi.fn(),
  updateFinanceSettings: vi.fn(),
}))

function renderPage(path = '/finance/settings') {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[path]}>
        <FinanceSettingsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const own = () => screen.getByRole('textbox', { name: 'My own rate' }) as HTMLInputElement
const plain = (t: string) => t.replace(/\s/g, ' ')

describe('FinanceSettingsPage: the dollar rate', () => {
  beforeEach(() => {
    vi.mocked(fetchBankUsdRate).mockReset().mockResolvedValue({ rate: 12_002.1, date: todayYmd(), source: 'cbu' })
    vi.mocked(fetchFinanceSettings).mockReset().mockResolvedValue({ usdRate: null })
    vi.mocked(updateFinanceSettings).mockReset().mockImplementation(async (dto) => ({ usdRate: dto.usdRate ?? null }))
  })

  test("the bank's rate for today, in use while there is no own one", async () => {
    renderPage()
    const section = await screen.findByRole('region', { name: 'Dollar rate' })
    expect(section.id).toBe('rate')
    await waitFor(() => expect(plain(section.textContent ?? '')).toContain('12 002,1'))
    expect(fetchBankUsdRate).toHaveBeenCalledWith(todayYmd())
    expect(screen.getByText('In use')).toBeTruthy()
    expect(own().value).toBe('')
    expect(screen.queryByRole('button', { name: "Use the bank's rate" })).toBeNull()
  })

  test('an own rate is typed and saved', async () => {
    renderPage()
    await screen.findByRole('region', { name: 'Dollar rate' })
    fireEvent.change(own(), { target: { value: '12300' } })
    expect(own().value).toBe('12 300')
    fireEvent.click(screen.getByRole('button', { name: 'Save rate' }))
    await waitFor(() => expect(updateFinanceSettings).toHaveBeenCalledWith({ usdRate: 12_300 }))
  })

  test("with an own rate: it is shown, and the bank's can be brought back", async () => {
    vi.mocked(fetchFinanceSettings).mockResolvedValue({ usdRate: 12_300 })
    renderPage()
    await waitFor(() => expect(own().value).toBe('12 300'))
    fireEvent.click(screen.getByRole('button', { name: "Use the bank's rate" }))
    await waitFor(() => expect(updateFinanceSettings).toHaveBeenCalledWith({ usdRate: null }))
  })

  test('opened from the rate badge (#rate): the section is brought into view', async () => {
    const scroll = vi.fn()
    Element.prototype.scrollIntoView = scroll
    renderPage('/finance/settings#rate')
    await screen.findByRole('region', { name: 'Dollar rate' })
    await waitFor(() => expect(scroll).toHaveBeenCalled())
  })
})
