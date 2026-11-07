/**
 * Which way review asks: from the English word to its translation, the other
 * way round, or a mix. Remembered per device.
 */
export type Direction = 'en-uz' | 'uz-en' | 'mixed'
/** The side a card shows first. */
export type Side = 'en' | 'uz'

const KEY = 'iapp-review-direction'
const DIRECTIONS: Direction[] = ['en-uz', 'uz-en', 'mixed']

export function loadDirection(): Direction {
  try {
    const saved = localStorage.getItem(KEY) as Direction | null
    return saved && DIRECTIONS.includes(saved) ? saved : 'en-uz'
  } catch {
    return 'en-uz'
  }
}

export function saveDirection(d: Direction) {
  try {
    localStorage.setItem(KEY, d)
  } catch {
    // Private mode: the choice just isn't remembered.
  }
}

/**
 * The side a word shows first. In a mix it is drawn from the word's id, so a
 * card keeps its side while it is on screen, yet words differ.
 */
export function frontSide(direction: Direction, wordId: string): Side {
  if (direction === 'en-uz') return 'en'
  if (direction === 'uz-en') return 'uz'
  let h = 0
  for (let i = 0; i < wordId.length; i++) h = (h * 31 + wordId.charCodeAt(i)) | 0
  return (h & 1) === 0 ? 'en' : 'uz'
}
