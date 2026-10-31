import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Languages } from 'lucide-react'
import { useToday } from '@/core/hooks/useToday'
import { englishKeys, fetchReview } from './api/english'
import s from './EnglishHomeCard.module.scss'

/** Home: how many words wait in today's review stack. */
export function EnglishHomeCard() {
  const today = useToday()
  // Same key as the Review page, so the two share one request.
  const { data, isError } = useQuery({
    queryKey: englishKeys.review(today),
    queryFn: () => fetchReview(today),
  })

  const n = data?.length ?? 0

  return (
    <Link to="/english/review" className={s.card}>
      <div className={s.head}>
        <span className={s.icon}>
          <Languages size={16} />
        </span>
        <span className={s.title}>English</span>
      </div>
      {isError ? (
        <div className={s.sub}>Couldn't load the review stack</div>
      ) : !data ? (
        <span className={s.skeleton} />
      ) : n === 0 ? (
        <div className={s.sub}>Nothing to memorise today</div>
      ) : (
        <div className={s.count}>
          {n} word{n === 1 ? '' : 's'} to memorise
        </div>
      )}
    </Link>
  )
}
