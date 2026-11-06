import type { DailySpendPoint } from '@/modules/finance/api/stats'

/** How this month's spending compares with last month's by the same day (null before any spending last month). */
export function paceVsLast(points: DailySpendPoint[]): { pct: number; more: boolean } | null {
  const today = [...points].reverse().find((p) => p.current !== null)
  if (!today || today.previous === 0) return null
  const diff = (today.current! - today.previous) / today.previous
  return { pct: Math.round(Math.abs(diff) * 100), more: diff > 0 }
}
