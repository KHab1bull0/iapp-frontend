import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Languages } from 'lucide-react'
import { useToday } from '@/core/hooks/useToday'
import { englishKeys, fetchReview } from './api/english'
import { useEnglishT } from './i18n'
import s from './EnglishHomeCard.module.scss'

/** Home: how many words wait in today's review stack. */
export function EnglishHomeCard() {
  const t = useEnglishT()
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
        <span className={s.title}>{t.title}</span>
      </div>
      {isError ? (
        <div className={s.sub}>{t.home.failed}</div>
      ) : !data ? (
        <span className={s.skeleton} />
      ) : n === 0 ? (
        <div className={s.sub}>{t.nothingToday}</div>
      ) : (
        <div className={s.count}>{t.home.count(n)}</div>
      )}
    </Link>
  )
}
