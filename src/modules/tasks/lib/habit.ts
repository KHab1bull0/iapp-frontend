import type { Task, TaskInput } from '@/modules/tasks/api/tasks'

export interface HabitDraft {
  isHabit: boolean
  identity: string
  /** Not edited in the form any more; kept so a cue already saved is sent back unchanged. */
  cue: string
}

/** The form's starting values for a task (or a new one). */
export function habitDraft(task: Task | null): HabitDraft {
  return {
    isHabit: task?.isHabit ?? false,
    identity: task?.identity ?? '',
    cue: task?.cue ?? '',
  }
}

/** The habit part of the save request; a task without a repeat is never a habit. */
export function habitInput(d: HabitDraft, repeats: boolean): Partial<TaskInput> {
  if (!repeats || !d.isHabit) return { isHabit: false }
  return {
    isHabit: true,
    identity: d.identity.trim() || null,
    cue: d.cue.trim() || null,
  }
}
