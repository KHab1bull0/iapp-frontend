import type { Category, Level, Word } from './api/english'

// Fixtures shared by the module's tests.
export const NEW: Level = { id: 'l0', name: 'New', intervalDays: 0, locked: true, createdAt: '' }
export const L3: Level = { id: 'l3', name: 'Three days', intervalDays: 3, locked: false, createdAt: '' }

export const word = (id: string, over: Partial<Word> = {}): Word => ({
  id,
  word: id,
  translation: `${id}-uz`,
  note: null,
  categoryId: null,
  levelId: NEW.id,
  reviewOn: '2026-10-31',
  lastReviewedAt: null,
  createdAt: '',
  updatedAt: '',
  ...over,
})

export const category = (id: string, name: string): Category => ({ id, name, createdAt: '2026-10-31T10:00:00.000Z' })
