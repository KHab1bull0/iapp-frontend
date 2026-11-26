import api from './axios'

export type InspirationKind = 'goal' | 'dream' | 'quote' | 'note'

/** Words the user wrote for themselves; `text` keeps its line breaks. */
export interface Inspiration {
  id: string
  text: string
  kind: InspirationKind | null
  createdAt: string
}

export interface InspirationInput {
  text: string
  kind: InspirationKind | null
}

export const inspirationsKey = ['inspirations'] as const
export const todayInspirationKey = (today: string) => ['inspirations', 'today', today] as const

export async function fetchInspirations(): Promise<Inspiration[]> {
  const { data } = await api.get<Inspiration[]>('/inspirations')
  return data
}

export async function fetchTodayInspiration(today: string): Promise<Inspiration | null> {
  const { data } = await api.get<{ inspiration: Inspiration | null }>('/inspirations/today', { params: { today } })
  return data.inspiration
}

export async function createInspiration(dto: InspirationInput): Promise<Inspiration> {
  const { data } = await api.post<Inspiration>('/inspirations', dto)
  return data
}

export async function updateInspiration(id: string, dto: Partial<InspirationInput>): Promise<Inspiration> {
  const { data } = await api.patch<Inspiration>(`/inspirations/${id}`, dto)
  return data
}

export async function deleteInspiration(id: string): Promise<void> {
  await api.delete(`/inspirations/${id}`)
}
