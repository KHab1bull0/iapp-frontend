import type { Task, TaskInput } from '@/modules/tasks/api/tasks'

/** The server keeps at most this many stages a habit. */
export const MAX_STAGES = 10
export const MAX_STAGE_DAYS = 1000
/** Offered when a task first becomes a habit: ten days, a month, and the 66 days a habit takes on average. */
export const SUGGESTED_STAGES = [10, 30, 66]

/** One stage row as the form edits it: text, so a half-typed number stays as typed. */
export interface StageDraft {
  key: string
  days: string
  reward: string
  /** Reached with these days; changing the days makes it a new stage the server starts over. */
  reachedDays: number | null
}

export interface HabitDraft {
  isHabit: boolean
  identity: string
  cue: string
  stages: StageDraft[]
}

let seq = 0
const nextKey = () => `stage-${++seq}`

export function stageDraft(days: number | '', reward = '', reachedDays: number | null = null): StageDraft {
  return { key: nextKey(), days: String(days), reward, reachedDays }
}

/** The form's starting values for a task (or a new one). */
export function habitDraft(task: Task | null): HabitDraft {
  return {
    isHabit: task?.isHabit ?? false,
    identity: task?.identity ?? '',
    cue: task?.cue ?? '',
    stages: (task?.stages ?? []).map((s) => stageDraft(s.days, s.reward ?? '', s.reachedAt ? s.days : null)),
  }
}

/**
 * The first row whose days are not a whole number in 1..1000 above the row
 * before it (the server's rule), or -1 when every row is fine.
 */
export function invalidStageAt(stages: StageDraft[]): number {
  let prev = 0
  for (let i = 0; i < stages.length; i++) {
    const n = Number(stages[i].days)
    if (stages[i].days.trim() === '' || !Number.isInteger(n) || n < 1 || n > MAX_STAGE_DAYS || n <= prev) return i
    prev = n
  }
  return -1
}

/** The habit part of the save request; a task without a repeat is never a habit. */
export function habitInput(d: HabitDraft, repeats: boolean): Partial<TaskInput> {
  if (!repeats || !d.isHabit) return { isHabit: false }
  return {
    isHabit: true,
    identity: d.identity.trim() || null,
    cue: d.cue.trim() || null,
    stages: d.stages.map((s) => ({ days: Number(s.days), reward: s.reward.trim() || null })),
  }
}
