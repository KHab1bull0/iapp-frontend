import { useQuery } from '@tanstack/react-query'
import { useToday } from '@/core/hooks/useToday'
import { englishKeys, fetchReview } from './api/english'
import { useExtraNew } from './lib/extraNew'

/** Words up in today's review (due, and the day's new words): the sidebar's count beside Memorise. */
export function useReviewCount(): number | null {
  const today = useToday()
  const [extra] = useExtraNew(today)
  const { data } = useQuery({
    queryKey: englishKeys.review(today, undefined, extra),
    queryFn: () => fetchReview(today, undefined, extra),
  })
  return data ? data.length : null
}
