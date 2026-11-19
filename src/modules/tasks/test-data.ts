import { todayYmd } from '@/core/lib/format'
import type { HabitProgress, Task } from './api/tasks'

// Fixtures shared by the module's tests.
export const task = (id: string, over: Partial<Task> = {}): Task => ({
  id,
  title: id.toUpperCase(),
  note: null,
  dueDate: todayYmd(),
  dueTime: null,
  repeatMode: 'none',
  repeatUnit: null,
  repeatEvery: null,
  repeatWeekdays: null,
  repeatMonthDay: null,
  completedAt: null,
  createdAt: '',
  updatedAt: '',
  isHabit: false,
  identity: null,
  cue: null,
  stages: [],
  progress: null,
  ...over,
})

export const progress = (over: Partial<HabitProgress> = {}): HabitProgress => ({
  streak: 4,
  best: 9,
  atRisk: false,
  stage: { position: 1, days: 10, reward: 'New mouse' },
  total: 21,
  ...over,
})

/** A daily habit, due today. */
export const habit = (id: string, over: Partial<Task> = {}): Task =>
  task(id, {
    repeatMode: 'schedule',
    repeatUnit: 'day',
    repeatEvery: 1,
    isHabit: true,
    identity: 'I am a reader',
    stages: [
      { id: `${id}-s1`, position: 1, days: 10, reward: 'New mouse', reachedAt: null, claimedAt: null },
      { id: `${id}-s2`, position: 2, days: 30, reward: 'A book', reachedAt: null, claimedAt: null },
    ],
    progress: progress(),
    ...over,
  })
