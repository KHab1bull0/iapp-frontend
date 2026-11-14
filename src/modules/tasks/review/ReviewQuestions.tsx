import { useId } from 'react'
import clsx from 'clsx'
import { AlertCircle, Check, RefreshCw } from 'lucide-react'
import type { ReviewAnswers } from '@/modules/tasks/api/reviews'
import { useReviewT } from './i18n'
import { useWeekAnswers, type AnswerField, type SaveState } from './useWeekAnswers'
import s from './Review.module.scss'

/** Matches the server's limit, so nothing typed is cut off there. */
const MAX = 2000

function Status({ state, onRetry }: { state: SaveState; onRetry: () => void }) {
  const t = useReviewT().questions
  return (
    // Announced politely: "Saved" after a pause in typing, not on every key.
    <div className={clsx(s.status, state === 'error' && s.error)} role="status" aria-live="polite">
      {state === 'saving' && t.saving}
      {state === 'saved' && (
        <>
          <Check size={14} aria-hidden /> {t.saved}
        </>
      )}
      {state === 'error' && (
        <>
          <AlertCircle size={14} aria-hidden /> {t.failed}
          <button type="button" className={s.retry} onClick={onRetry}>
            <RefreshCw size={14} aria-hidden /> {t.retry}
          </button>
        </>
      )}
    </div>
  )
}

/**
 * The week's three questions. Mount with `key={weekStart}`: the answers are
 * seeded from `initial` once, and a new week starts a new draft.
 */
export function ReviewQuestions({
  weekStart,
  today,
  initial,
}: {
  weekStart: string
  today: string
  initial: ReviewAnswers | null
}) {
  const t = useReviewT().questions
  const id = useId()
  const { draft, update, state, flush } = useWeekAnswers(weekStart, today, initial)
  const fields: { key: AnswerField; label: string }[] = [
    { key: 'wentWell', label: t.wentWell },
    { key: 'wentBadly', label: t.wentBadly },
    { key: 'change', label: t.change },
  ]

  return (
    <section className={s.card} aria-label={t.title}>
      <div className={s.cardHead}>
        <h2 className={s.cardTitle}>{t.title}</h2>
        <Status state={state} onRetry={flush} />
      </div>
      <p className={s.hint}>{t.hint}</p>
      {fields.map(({ key, label }) => (
        <div key={key} className={s.field}>
          <label className={s.label} htmlFor={`${id}-${key}`}>
            {label}
          </label>
          <textarea
            id={`${id}-${key}`}
            className={s.textarea}
            value={draft[key]}
            maxLength={MAX}
            rows={3}
            placeholder={t.placeholder}
            onChange={(e) => update(key, e.target.value)}
            // Leaving a field is a natural pause: save now rather than after the timer.
            onBlur={flush}
          />
        </div>
      ))}
    </section>
  )
}
