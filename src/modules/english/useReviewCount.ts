import { useQuery } from '@tanstack/react-query'
import { useToday } from '@/core/hooks/useToday'
import { englishKeys, fetchReview } from './api/english'

/** Words waiting in today's review: the sidebar's count beside Memorise. */
export function useReviewCount(): number | null {
  const today = useToday()
  const { data } = useQuery({ queryKey: englishKeys.review(today), queryFn: () => fetchReview(today) })
  return data ? data.length : null
}
