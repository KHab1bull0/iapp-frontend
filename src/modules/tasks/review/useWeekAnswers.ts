import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useLang } from '@/core/i18n'
import { apiErrorText } from '@/core/i18n/errors'
import { reviewKeys, saveWeek, type ReviewAnswers } from '@/modules/tasks/api/reviews'

export type AnswerField = keyof ReviewAnswers
export type Answers = Record<AnswerField, string>
export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

/** Quiet time after the last keystroke before the answers go to the server. */
export const AUTOSAVE_MS = 800

const FIELDS: AnswerField[] = ['wentWell', 'wentBadly', 'change']

const toDraft = (a: ReviewAnswers | null): Answers => ({
  wentWell: a?.wentWell ?? '',
  wentBadly: a?.wentBadly ?? '',
  change: a?.change ?? '',
})

const same = (a: Answers, b: Answers) => FIELDS.every((f) => a[f] === b[f])

/** Only what changed since the last save: the PUT is partial, so the rest keeps its saved value. */
const changed = (next: Answers, saved: Answers): Partial<Answers> =>
  Object.fromEntries(FIELDS.filter((f) => next[f] !== saved[f]).map((f) => [f, next[f]]))

/**
 * The week's three answers as the user types them, saved a moment after they
 * stop. The draft is local and only seeded once: the week's query refetches
 * whenever a task changes, and that must never overwrite what is being typed.
 *
 * Nothing typed is lost on leaving: a pending save goes out at once when the
 * page unmounts (another week, another page) or the app is hidden or closed.
 * Saves run one after another, so an older one can't land after a newer one.
 */
export function useWeekAnswers(weekStart: string, today: string, initial: ReviewAnswers | null) {
  const qc = useQueryClient()
  const { lang } = useLang()
  const [draft, setDraft] = useState<Answers>(() => toDraft(initial))
  const [state, setState] = useState<SaveState>('idle')
  /** The server's reason when it has one (errors.review_future_week), else null for the generic line. */
  const [error, setError] = useState<string | null>(null)
  const latest = useRef(draft)
  const saved = useRef(draft)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const queue = useRef<Promise<void>>(Promise.resolve())
  const alive = useRef(true)

  const flush = useCallback(() => {
    clearTimeout(timer.current)
    timer.current = undefined
    queue.current = queue.current.then(async () => {
      const next = latest.current
      if (same(next, saved.current)) {
        if (alive.current) setState((s) => (s === 'saving' ? 'saved' : s))
        return
      }
      if (alive.current) setState('saving')
      try {
        const week = await saveWeek({ weekStart, today, ...changed(next, saved.current) })
        saved.current = next
        qc.setQueryData(reviewKeys.week(weekStart, today), week)
        void qc.invalidateQueries({ queryKey: reviewKeys.lists })
        // Typed on while this was in flight: that change has its own save coming.
        if (alive.current && latest.current === next) setState('saved')
      } catch (err) {
        if (!alive.current) return
        setError(apiErrorText(err, lang, '') || null)
        setState('error')
      }
    })
  }, [qc, weekStart, today, lang])

  const update = useCallback(
    (field: AnswerField, value: string) => {
      const next = { ...latest.current, [field]: value }
      latest.current = next
      setDraft(next)
      setState('saving')
      clearTimeout(timer.current)
      timer.current = setTimeout(flush, AUTOSAVE_MS)
    },
    [flush],
  )

  useEffect(() => {
    alive.current = true
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', flush)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', flush)
      alive.current = false
      flush()
    }
  }, [flush])

  return { draft, update, state, error, flush }
}
