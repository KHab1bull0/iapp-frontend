import api from '@/core/api/axios'

export type Currency = 'UZS' | 'USD'

/** So'm per dollar for a day: the user's own (manual) or the Central Bank's; null when none is known. */
export type UsdRate =
  | { rate: number; date: string; source: 'cbu' }
  | { rate: number; source: 'manual' }
  | { rate: null; source?: undefined }

export interface FinanceSettings {
  /** The user's own so'm per dollar; null = the Central Bank's. */
  usdRate: number | null
}

export const ratesKeys = {
  usd: (date: string) => ['finance', 'rate', 'USD', date] as const,
  bankUsd: (date: string) => ['finance', 'rate', 'USD', date, 'cbu'] as const,
  settings: ['finance', 'settings'] as const,
}

/** What a dollar transaction on `date` is prefilled with. */
export const fetchUsdRate = async (date: string): Promise<UsdRate> => {
  const { data } = await api.get<UsdRate>('/finance/rates/USD', { params: { date } })
  return data
}

/** The Central Bank's rate for `date`, even when the user has their own. */
export const fetchBankUsdRate = async (date: string): Promise<UsdRate> => {
  const { data } = await api.get<UsdRate>('/finance/rates/USD', { params: { date, source: 'cbu' } })
  return data
}

export const fetchFinanceSettings = async (): Promise<FinanceSettings> => {
  const { data } = await api.get<FinanceSettings>('/finance/settings')
  return data
}

export const updateFinanceSettings = async (dto: Partial<FinanceSettings>): Promise<FinanceSettings> => {
  const { data } = await api.patch<FinanceSettings>('/finance/settings', dto)
  return data
}
