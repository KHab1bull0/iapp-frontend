import { useQuery } from '@tanstack/react-query'
import { useToday } from '@/core/hooks/useToday'
import { fetchToday, tasksKeys } from './api/tasks'

/** Tasks due today or overdue: the sidebar's count beside Today. */
export function useDueCount(): number | null {
  const today = useToday()
  // Same key as the Today page and the home card: one request between them.
  const { data } = useQuery({ queryKey: tasksKeys.today(today), queryFn: () => fetchToday(today) })
  return data ? data.overdue.length + data.today.length : null
}
