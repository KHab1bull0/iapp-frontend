import api from '@/core/api/axios'

/** Groups categories of one type; only for grouping, never on a transaction. */
export interface CategoryParent {
  id: string
  name: string
  type: 'income' | 'expense'
  color: string
  icon: string
  createdAt: string
}

export interface CreateCategoryParentDto {
  name: string
  type: 'income' | 'expense'
  color?: string
  icon?: string
  /** The categories in it; on update, the whole new set. */
  categoryIds?: string[]
}

export type UpdateCategoryParentDto = Partial<Omit<CreateCategoryParentDto, 'type'>>

export const categoryParentsKey = ['categoryParents'] as const

export async function fetchCategoryParents(): Promise<CategoryParent[]> {
  const { data } = await api.get<CategoryParent[]>('/finance/category-parents')
  return data
}

export async function createCategoryParent(dto: CreateCategoryParentDto): Promise<CategoryParent> {
  const { data } = await api.post<CategoryParent>('/finance/category-parents', dto)
  return data
}

export async function updateCategoryParent(id: string, dto: UpdateCategoryParentDto): Promise<CategoryParent> {
  const { data } = await api.patch<CategoryParent>(`/finance/category-parents/${id}`, dto)
  return data
}

export async function deleteCategoryParent(id: string): Promise<void> {
  await api.delete(`/finance/category-parents/${id}`)
}
