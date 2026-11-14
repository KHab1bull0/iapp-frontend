import clsx from 'clsx'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Check, ChevronRight, RefreshCw } from 'lucide-react'
import { EmptyState } from '@/core/components/ui/EmptyState'
import { Skeleton } from '@/core/components/ui/Skeleton'
import { fetchReviews, reviewKeys } from '@/modules/tasks/api/reviews'
import { useReviewT } from './i18n'
import { weekRange } from './week'
import s from './Review.module.scss'

/**
 * Weeks before the current one, newest first, each opening as `?week=`.
 * The current week is the page's default, so it isn't listed as "past".
 */
export function PastWeeks({
  today,
  current,
  open,
  onOpen,
}: {
  today: string
  current: string
  open: string
  onOpen: () => void
}) {
  const t = useReviewT()
  const list = useQuery({ queryKey: reviewKeys.list(today), queryFn: () => fetchReviews(today) })

  let body
  if (list.isPending) {
    body = <Skeleton height="calc(var(--row-h-sm) * 3)" radius="var(--radius-lg)" />
  } else if (list.isError) {
    body = (
      <EmptyState
        compact
        title={t.past.loadFailed}
        action={{ label: t.retry, icon: RefreshCw, onClick: () => void list.refetch() }}
      />
    )
  } else {
    const past = list.data.filter((w) => w.weekStart < current)
    body = past.length ? (
      <ul className={s.weeks}>
        {past.map((w) => {
          const range = weekRange(w.weekStart)
          return (
            <li key={w.weekStart}>
              <Link
                to={`?week=${w.weekStart}`}
                // Replaced, like the stepper: Back leaves the review instead of walking through weeks.
                replace
                className={s.weekRow}
                aria-current={w.weekStart === open ? 'page' : undefined}
                aria-label={`${t.past.open(range, w.rate)}, ${w.answered ? t.past.answered : t.past.notAnswered}`}
                onClick={onOpen}
              >
                <span className={s.weekRange}>{range}</span>
                <span className={clsx(s.badge, w.answered && s.answered)}>
                  {w.answered && <Check size={12} aria-hidden />}
                  {w.answered ? t.past.answered : t.past.notAnswered}
                </span>
                <span className={s.weekRate}>{w.rate}%</span>
                <ChevronRight size={18} className={s.chevron} aria-hidden />
              </Link>
            </li>
          )
        })}
      </ul>
    ) : (
      <div className={s.card}>
        <EmptyState compact title={t.past.empty} description={t.past.emptySub} />
      </div>
    )
  }

  return (
    <section className={s.section} aria-label={t.past.title}>
      <h2 className={s.sectionLabel}>{t.past.title}</h2>
      {body}
    </section>
  )
}
