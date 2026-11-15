import { useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { BackButton } from '@/core/components/BackButton'
import { EmptyState } from '@/core/components/ui/EmptyState'
import { Skeleton } from '@/core/components/ui/Skeleton'
import { useToday } from '@/core/hooks/useToday'
import { addDaysYmd } from '@/core/lib/format'
import { fetchWeek, reviewKeys } from '@/modules/tasks/api/reviews'
import { PastWeeks } from '@/modules/tasks/review/PastWeeks'
import { ReviewQuestions } from '@/modules/tasks/review/ReviewQuestions'
import { WeekSummary } from '@/modules/tasks/review/WeekSummary'
import { useReviewT } from '@/modules/tasks/review/i18n'
import { mondayOf, weekFromParam, weekRange } from '@/modules/tasks/review/week'
import r from '@/modules/tasks/review/Review.module.scss'
// Shell styles (back link, page heading), as the module settings pages use them.
import shell from '@/pages/settings/settings.module.scss'
import s from '../TasksPages.module.scss'

/** ‹ 9 Nov – 15 Nov › — a week at a time, never into weeks still to come. */
function WeekStepper({ weekStart, current, onChange }: { weekStart: string; current: string; onChange: (w: string) => void }) {
  const t = useReviewT()
  return (
    <div className={r.stepper} role="group" aria-label={t.week}>
      <button type="button" className={r.stepBtn} onClick={() => onChange(addDaysYmd(weekStart, -7))} aria-label={t.prevWeek}>
        <ChevronLeft size={18} />
      </button>
      <span className={r.stepValue} aria-live="polite">
        {weekRange(weekStart)}
      </span>
      <button
        type="button"
        className={r.stepBtn}
        onClick={() => onChange(addDaysYmd(weekStart, 7))}
        disabled={weekStart >= current}
        aria-label={t.nextWeek}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  )
}

/**
 * Tasks → Weekly review: how the week went (tasks and habits),
 * three short questions about it, and the weeks before. The week is in the
 * URL (`?week=`, any day of it), so a past week can be linked and reopened.
 */
export function ReviewPage() {
  const t = useReviewT()
  const today = useToday()
  const top = useRef<HTMLDivElement>(null)
  const [params, setParams] = useSearchParams()
  const current = mondayOf(today)
  const weekStart = weekFromParam(params.get('week'), today)

  const week = useQuery({
    queryKey: reviewKeys.week(weekStart, today),
    queryFn: () => fetchWeek(weekStart, today),
  })

  // Replaced, not pushed: Back leaves the review rather than stepping back through weeks.
  const goTo = (next: string) => setParams(next >= current ? {} : { week: next }, { replace: true })

  let body
  if (week.isError) {
    body = (
      <EmptyState title={t.loadFailed} action={{ label: t.retry, icon: RefreshCw, onClick: () => void week.refetch() }} />
    )
  } else if (week.isPending) {
    body = (
      <div className={r.skeletons} aria-hidden>
        <Skeleton height={180} radius="var(--radius-lg)" />
        <Skeleton height={120} radius="var(--radius-lg)" />
        <Skeleton height={240} radius="var(--radius-lg)" />
      </div>
    )
  } else {
    body = (
      <div className={r.layout}>
        <div className={r.main}>
          <WeekSummary week={week.data} />
        </div>
        <div className={r.side}>
          {/* Keyed by week: a new week starts its own draft, and the old one's pending save goes out. */}
          <ReviewQuestions key={weekStart} weekStart={weekStart} today={today} initial={week.data.answers} />
          <PastWeeks
            today={today}
            current={current}
            open={weekStart}
            onOpen={() => top.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' })}
          />
        </div>
      </div>
    )
  }

  return (
    <div className={s.page} ref={top}>
      {/* Back to wherever it was opened from: Stats, or a notification (then Stats). */}
      <BackButton fallback="/tasks" className={shell.backLink} label={t.back} />
      <header className={shell.pageHead}>
        <div>
          <h1 className={shell.h1}>{t.title}</h1>
          <div className={shell.pageSub}>{t.subtitle}</div>
        </div>
        <WeekStepper weekStart={weekStart} current={current} onChange={goTo} />
      </header>
      {body}
    </div>
  )
}
