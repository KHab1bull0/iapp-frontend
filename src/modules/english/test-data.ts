import type { Level, Tag, TagGroup, Word } from './api/english'

// Fixtures shared by the module's tests.
export const NEW: Level = { id: 'l0', name: 'New', intervalDays: 0, locked: true, createdAt: '' }
export const L3: Level = { id: 'l3', name: 'Three days', intervalDays: 3, locked: false, createdAt: '' }

export const word = (id: string, over: Partial<Word> = {}): Word => ({
  id,
  word: id,
  translation: `${id}-uz`,
  note: null,
  description: null,
  example: null,
  tagIds: [],
  levelId: NEW.id,
  reviewOn: '2026-10-31',
  lastReviewedAt: null,
  createdAt: '',
  updatedAt: '',
  ...over,
})

export const tag = (id: string, name: string, over: Partial<Tag> = {}): Tag => ({
  id,
  name,
  groupId: null,
  createdAt: '2026-10-31T10:00:00.000Z',
  count: 0,
  due: 0,
  ...over,
})

export const group = (id: string, name: string): TagGroup => ({ id, name, createdAt: '2026-10-31T10:00:00.000Z' })
