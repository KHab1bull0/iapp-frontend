import type { EnglishMessages } from '@/modules/english/i18n'

const DAY_MS = 86_400_000

function daysBetween(from: string, to: string): number {
  const t = (s: string) => {
    const [y, m, d] = s.split('-').map(Number)
    return Date.UTC(y, m - 1, d)
  }
  return Math.round((t(to) - t(from)) / DAY_MS)
}

/** "Due today", "Due 2 days ago", "Tomorrow", "In 5 days". */
export function reviewLabel(reviewOn: string, today: string, t: EnglishMessages): string {
  const diff = daysBetween(today, reviewOn)
  if (diff === 0) return t.vocab.dueToday
  if (diff < 0) return t.vocab.dueAgo(-diff)
  if (diff === 1) return t.vocab.tomorrow
  return t.vocab.inDays(diff)
}
