import { useRef } from 'react'
import clsx from 'clsx'
import { useSearchParams } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { BackButton } from '@/core/components/BackButton'
import { EmptyState } from '@/core/components/ui/EmptyState'
import { useToday } from '@/core/hooks/useToday'
import { addDaysYmd } from '@/core/lib/format'
import { fetchWeek, reviewKeys } from '@/modules/tasks/api/reviews'
import { PastWeeks } from '@/modules/tasks/review/PastWeeks'
import { ReviewQuestions } from '@/modules/tasks/review/ReviewQuestions'
import { QuestionsSkeleton, WeekSummarySkeleton } from '@/modules/tasks/review/skeletons'
import { WeekSummary } from '@/modules/tasks/review/WeekSummary'
import { useReviewT } from '@/modules/tasks/review/i18n'
import { mondayOf, weekFromParam, weekRange } from '@/modules/tasks/review/week'
import r from '@/modules/tasks/review/Review.module.scss'
import k from '@/modules/tasks/components/Skeletons.module.scss'
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
    // Stepping to another week keeps this one on screen, quieter, until the
    // next one arrives: the page never blanks into outlines between weeks.
    placeholderData: keepPreviousData,
  })
  const stale = week.isPlaceholderData
  // The week whose numbers and answers are on screen: the one before, while stepping.
  const shown = stale ? (week.data?.weekStart ?? weekStart) : weekStart

  // Replaced, not pushed: Back leaves the review rather than stepping back through weeks.
  const goTo = (next: string) => setParams(next >= current ? {} : { week: next }, { replace: true })

  let body
  if (week.isError) {
    body = (
      <EmptyState title={t.loadFailed} action={{ label: t.retry, icon: RefreshCw, onClick: () => void week.refetch() }} />
    )
  } else {
    // First load: the page in outline. Stepping: the week before stays, quieter
    // and out of reach (its answers are that week's, not this one's) until this one lands.
    const busy = week.isPending || stale
    body = (
      <div className={r.layout} aria-busy={busy || undefined}>
        {busy && <span className="sr-only">{t.loading}</span>}
        <div className={clsx(r.main, stale && k.stale)} inert={stale}>
          {week.isPending ? <WeekSummarySkeleton /> : <WeekSummary week={week.data} />}
        </div>
        <div className={r.side}>
          {week.isPending ? (
            <QuestionsSkeleton />
          ) : (
            <div className={clsx(stale && k.stale)} inert={stale}>
              {/* Keyed by week: a new week starts its own draft, and the old one's pending save goes out. */}
              <ReviewQuestions key={shown} weekStart={shown} today={today} initial={week.data.answers} />
            </div>
          )}
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
      <BackButton fallback="/tasks/stats" className={shell.backLink} label={t.back} />
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
