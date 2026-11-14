import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CalendarRange, ChevronRight } from 'lucide-react'
import { useToday } from '@/core/hooks/useToday'
import { fetchWeek, reviewKeys } from '@/modules/tasks/api/reviews'
import { useReviewT } from './i18n'
import { mondayOf } from './week'
import s from './Review.module.scss'

/** Tasks → Stats, at the top: the way into the weekly review, with how this week is going. */
export function ReviewEntryCard() {
  const t = useReviewT().entry
  const today = useToday()
  const weekStart = mondayOf(today)
  // The same query the review page opens with, so it opens already filled in.
  const { data } = useQuery({
    queryKey: reviewKeys.week(weekStart, today),
    queryFn: () => fetchWeek(weekStart, today),
  })

  return (
    <Link to="/tasks/review" className={s.entry} viewTransition>
      <span className={s.entryIcon} aria-hidden>
        <CalendarRange size={20} />
      </span>
      <span className={s.entryText}>
        <span className={s.entryTitle}>{t.title}</span>
        {/* Nothing until it loads (or if it fails): the card still opens the page. */}
        {data && <span className={s.entrySub}>{t.rate(data.tasks.rate)}</span>}
      </span>
      <ChevronRight size={18} className={s.chevron} aria-hidden />
    </Link>
  )
}
