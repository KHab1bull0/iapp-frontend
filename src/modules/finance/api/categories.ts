import api from '@/core/api/axios'

export interface Category {
  id: string
  name: string
  type: 'income' | 'expense'
  color: string
  icon: string
}

export interface CreateCategoryDto {
  name: string
  type: 'income' | 'expense'
  color?: string
  icon?: string
}

export const fetchCategories = async (): Promise<Category[]> => {
  const { data } = await api.get<Category[]>('/finance/categories')
  return data
}

export type UpdateCategoryDto = Partial<CreateCategoryDto>

export const createCategory = async (dto: CreateCategoryDto): Promise<Category> => {
  const { data } = await api.post<Category>('/finance/categories', dto)
  return data
}

export const updateCategory = async (id: string, dto: UpdateCategoryDto): Promise<Category> => {
  const { data } = await api.patch<Category>(`/finance/categories/${id}`, dto)
  return data
}

export const deleteCategory = async (id: string): Promise<void> => {
  await api.delete(`/finance/categories/${id}`)
}
