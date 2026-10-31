import api from '@/core/api/axios'

export interface Level {
  id: string
  name: string
  /** Days until a word at this level comes back; 0 for New. */
  intervalDays: number
  /** The New level: every user has one, it can't be deleted. */
  locked: boolean
  createdAt: string
}

export interface Category {
  id: string
  name: string
  createdAt: string
}

export interface Word {
  id: string
  word: string
  translation: string
  note: string | null
  categoryId: string | null
  levelId: string
  /** The day it is to be memorised (YYYY-MM-DD); in the review stack from then on. */
  reviewOn: string
  lastReviewedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface WordInput {
  word: string
  translation: string
  note?: string | null
  categoryId?: string | null
  levelId?: string
  reviewOn?: string
}

export interface WordFilters {
  search?: string
  levelId?: string
  categoryId?: string
}

/** Every key starts with 'english', so invalidating ['english'] refreshes it all, home card included. */
export const englishKeys = {
  all: ['english'] as const,
  levels: ['english', 'levels'] as const,
  categories: ['english', 'categories'] as const,
  words: (f: WordFilters) => ['english', 'words', f] as const,
  word: (id: string) => ['english', 'word', id] as const,
  review: (day: string) => ['english', 'review', day] as const,
  stats: (day: string) => ['english', 'stats', day] as const,
}

export async function fetchLevels(): Promise<Level[]> {
  return (await api.get<Level[]>('/english/levels')).data
}
export async function createLevel(input: { name: string; intervalDays: number }): Promise<Level> {
  return (await api.post<Level>('/english/levels', input)).data
}
export async function updateLevel(id: string, input: { name?: string; intervalDays?: number }): Promise<Level> {
  return (await api.patch<Level>(`/english/levels/${id}`, input)).data
}
export async function deleteLevel(id: string): Promise<void> {
  await api.delete(`/english/levels/${id}`)
}

export async function fetchCategories(): Promise<Category[]> {
  return (await api.get<Category[]>('/english/categories')).data
}
export async function createCategory(input: { name: string }): Promise<Category> {
  return (await api.post<Category>('/english/categories', input)).data
}
export async function updateCategory(id: string, input: { name: string }): Promise<Category> {
  return (await api.patch<Category>(`/english/categories/${id}`, input)).data
}
export async function deleteCategory(id: string): Promise<void> {
  await api.delete(`/english/categories/${id}`)
}

export async function fetchWords(filters: WordFilters = {}): Promise<Word[]> {
  return (await api.get<Word[]>('/english/words', { params: filters })).data
}
export async function fetchWord(id: string): Promise<Word> {
  return (await api.get<Word>(`/english/words/${id}`)).data
}
export async function createWord(input: WordInput): Promise<Word> {
  return (await api.post<Word>('/english/words', input)).data
}
export async function updateWord(id: string, input: Partial<WordInput>): Promise<Word> {
  return (await api.patch<Word>(`/english/words/${id}`, input)).data
}
export async function deleteWord(id: string): Promise<void> {
  await api.delete(`/english/words/${id}`)
}

/** The review stack: words whose day has come. */
export async function fetchReview(today: string): Promise<Word[]> {
  return (await api.get<Word[]>('/english/review', { params: { today } })).data
}
export async function answerWord(id: string, result: 'remembered' | 'forgot', today: string): Promise<Word> {
  return (await api.post<Word>(`/english/words/${id}/review`, { result, today })).data
}

export interface Stats {
  total: number
  /** Due today, overdue included. */
  due: number
  overdue: number
  /** Never answered in review yet. */
  unseen: number
  addedThisWeek: number
  reviewedToday: number
  /** Days in a row with at least one answer, up to today. */
  streak: number
  /** Answers in the last 30 days. */
  accuracy: { remembered: number; forgot: number }
  levels: (Pick<Level, 'id' | 'name' | 'locked' | 'intervalDays'> & { count: number })[]
  /** Most words first; `id: null` is the words without a category. */
  categories: { id: string | null; name: string | null; count: number }[]
  /** The next 7 days, tomorrow first. */
  upcoming: { date: string; count: number }[]
  /** The last 14 days, today last. */
  activity: { date: string; remembered: number; forgot: number }[]
}

export async function fetchStats(today: string): Promise<Stats> {
  return (await api.get<Stats>('/english/stats', { params: { today } })).data
}
