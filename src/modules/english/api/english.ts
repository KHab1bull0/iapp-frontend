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

/** A shelf for tags. Seeded ones are stored in English ("Topics", "Parts of speech") and shown translated. */
export interface TagGroup {
  id: string
  name: string
  createdAt: string
}

/** A label on words: a topic ("family") or a part of speech ("noun"); a word can wear many. */
export interface Tag {
  id: string
  name: string
  groupId: string | null
  createdAt: string
  /** Words wearing it. */
  count: number
  /** Of those, due on the day asked for. */
  due: number
}

export interface Word {
  id: string
  word: string
  translation: string
  /** A note on the translation (Uzbek): usage, nuance. */
  note: string | null
  /** The meaning in simple English: shown with the word on the review card's front. */
  description: string | null
  /** An English sentence using the word. */
  example: string | null
  /** The tags it wears. */
  tagIds: string[]
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
  description?: string | null
  example?: string | null
  /** The whole set of tags; on update, replaces the old one. */
  tagIds?: string[]
  levelId?: string
  reviewOn?: string
}

/** One row of the Excel template, as sent to the server. */
export interface ImportRow {
  word: string
  translation: string
  description?: string
  example?: string
  note?: string
  /** Tag names (or ids). */
  tags?: string[]
}

export interface ImportResult {
  created: number
  skipped: { word: string; reason: 'exists' | 'repeated' }[]
  tagsCreated: string[]
}

export interface WordFilters {
  search?: string
  levelId?: string
  tagId?: string
}

/** Every key starts with 'english', so invalidating ['english'] refreshes it all, home card included. */
export const englishKeys = {
  all: ['english'] as const,
  levels: ['english', 'levels'] as const,
  groups: ['english', 'tag-groups'] as const,
  tags: (day: string) => ['english', 'tags', day] as const,
  words: (f: WordFilters) => ['english', 'words', f] as const,
  word: (id: string) => ['english', 'word', id] as const,
  /** Today's stack; with a tag, only its words. */
  review: (day: string, tagId?: string) => ['english', 'review', day, tagId ?? 'all'] as const,
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

export async function fetchGroups(): Promise<TagGroup[]> {
  return (await api.get<TagGroup[]>('/english/tag-groups')).data
}
export async function createGroup(input: { name: string }): Promise<TagGroup> {
  return (await api.post<TagGroup>('/english/tag-groups', input)).data
}
export async function updateGroup(id: string, input: { name: string }): Promise<TagGroup> {
  return (await api.patch<TagGroup>(`/english/tag-groups/${id}`, input)).data
}
export async function deleteGroup(id: string): Promise<void> {
  await api.delete(`/english/tag-groups/${id}`)
}

/** Every tag, with its word count and how many are due `today`. */
export async function fetchTags(today: string): Promise<Tag[]> {
  return (await api.get<Tag[]>('/english/tags', { params: { today } })).data
}
export async function createTag(input: { name: string; groupId?: string | null }): Promise<Tag> {
  return (await api.post<Tag>('/english/tags', input)).data
}
export async function updateTag(id: string, input: { name?: string; groupId?: string | null }): Promise<Tag> {
  return (await api.patch<Tag>(`/english/tags/${id}`, input)).data
}
export async function deleteTag(id: string): Promise<void> {
  await api.delete(`/english/tags/${id}`)
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
/** Adds the rows of an Excel file in one go (all or nothing); words already there are skipped. */
export async function importWords(input: {
  words: ImportRow[]
  today: string
  createTags?: boolean
}): Promise<ImportResult> {
  return (await api.post<ImportResult>('/english/words/import', input)).data
}

export async function deleteWord(id: string): Promise<void> {
  await api.delete(`/english/words/${id}`)
}

/** The review stack: words whose day has come. */
/** Today's stack; with `tagId`, only the words wearing that tag. */
export async function fetchReview(today: string, tagId?: string): Promise<Word[]> {
  return (await api.get<Word[]>('/english/review', { params: { today, tagId } })).data
}
/** Puts a due word at the level the user picked: it comes back after that level's days. */
export async function answerWord(id: string, levelId: string, today: string): Promise<Word> {
  return (await api.post<Word>(`/english/words/${id}/review`, { levelId, today })).data
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
  /** Every tag with how many words wear it, most first. */
  tags: { id: string; name: string; groupId: string | null; count: number }[]
  /** Words with no tag. */
  untagged: number
  /** The next 7 days, tomorrow first. */
  upcoming: { date: string; count: number }[]
  /** The last 14 days, today last. */
  activity: { date: string; remembered: number; forgot: number }[]
  /** The vocabulary's size at the end of each of the last 30 days, today last. */
  growth: { date: string; total: number }[]
}

export async function fetchStats(today: string): Promise<Stats> {
  return (await api.get<Stats>('/english/stats', { params: { today } })).data
}
