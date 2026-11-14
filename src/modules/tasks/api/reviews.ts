import api from '@/core/api/axios'

/** The three questions of a week, as the server stores them (empty → null). */
export interface ReviewAnswers {
  wentWell: string | null
  wentBadly: string | null
  change: string | null
}

export interface ReviewHabit {
  taskId: string
  title: string
  done: number
  due: number
  streak: number
}

/** One week (Monday to Sunday): what happened in it, and what the user made of it. */
export interface WeekReview {
  /** Monday, YYYY-MM-DD. */
  weekStart: string
  /** Sunday, YYYY-MM-DD. */
  weekEnd: string
  tasks: {
    done: number
    due: number
    /** 0..100: occurrences done out of those due. */
    rate: number
    missed: number
    rest: number
  }
  habits: ReviewHabit[]
  english: { answered: number; remembered: number; added: number }
  finance: { income: number; expense: number }
  answers: ReviewAnswers | null
}

/** A past week in the list: its rate and whether its questions were answered. */
export interface ReviewListItem {
  weekStart: string
  rate: number
  answered: boolean
}

/**
 * A partial save: a field left out keeps what is saved, "" (or only spaces)
 * clears it. `today` is the device's, as the task endpoints take it.
 */
export interface WeekAnswersInput extends Partial<ReviewAnswers> {
  weekStart: string
  today?: string
}

/**
 * Under 'tasks', so the invalidation after any task change (a tick, an undo)
 * refreshes the week's numbers as well.
 */
export const reviewKeys = {
  all: ['tasks', 'review'] as const,
  week: (weekStart: string, today: string) => ['tasks', 'review', 'week', weekStart, today] as const,
  /** Prefix of every list key, for invalidation. */
  lists: ['tasks', 'review', 'list'] as const,
  list: (today: string) => ['tasks', 'review', 'list', today] as const,
}

export async function fetchWeek(weekStart: string, today: string): Promise<WeekReview> {
  const { data } = await api.get<WeekReview>('/reviews/week', { params: { today, weekStart } })
  return data
}

/** Upserts the week's answers; returns the whole week, as GET does. */
export async function saveWeek(input: WeekAnswersInput): Promise<WeekReview> {
  const { data } = await api.put<WeekReview>('/reviews/week', input)
  return data
}

/** Up to 26 weeks, newest first, the current one always among them. */
export async function fetchReviews(today: string): Promise<ReviewListItem[]> {
  const { data } = await api.get<ReviewListItem[]>('/reviews', { params: { today } })
  return data
}
