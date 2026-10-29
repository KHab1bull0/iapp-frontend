import api from '@/core/api/axios'
import type { Category } from './categories'

export interface Transaction {
  id: string
  amount: number
  type: 'income' | 'expense'
  note: string | null
  date: string
  time?: string
  createdAt: string
  category: Pick<Category, 'id' | 'name' | 'icon' | 'color'>
}

export interface PaginatedTransactions {
  data: Transaction[]
  hasMore: boolean
  page: number
  limit: number
}

export interface TransactionFilters {
  startDate?: string
  endDate?: string
  type?: 'income' | 'expense'
  categoryId?: string
  search?: string
}

export interface CreateTransactionDto {
  amount: number
  type: 'income' | 'expense'
  categoryId: string
  date: string
  time?: string
  note?: string
}

export type UpdateTransactionDto = Partial<CreateTransactionDto>

export const fetchTransactions = async (
  filters: TransactionFilters,
  page = 1,
  limit = 20,
): Promise<PaginatedTransactions> => {
  const { data } = await api.get<PaginatedTransactions>('/finance/transactions', {
    params: { ...filters, page, limit },
  })
  return data
}

/** Used by the edit page, which may be opened from a URL with no row in hand. */
export const fetchTransaction = async (id: string): Promise<Transaction> => {
  const { data } = await api.get<Transaction>(`/finance/transactions/${id}`)
  return data
}

export const createTransaction = async (dto: CreateTransactionDto): Promise<Transaction> => {
  const { data } = await api.post<Transaction>('/finance/transactions', dto)
  return data
}

export const updateTransaction = async (
  id: string,
  dto: UpdateTransactionDto,
): Promise<Transaction> => {
  const { data } = await api.patch<Transaction>(`/finance/transactions/${id}`, dto)
  return data
}

export const deleteTransaction = async (id: string): Promise<void> => {
  await api.delete(`/finance/transactions/${id}`)
}
