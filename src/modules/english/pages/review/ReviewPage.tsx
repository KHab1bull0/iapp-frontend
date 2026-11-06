import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Flame, Plus, RefreshCw, Volume2, X } from 'lucide-react'
import { EmptyState } from '@/core/components/ui/EmptyState'
import { ProgressBar } from '@/core/components/ui/Progress'
import { useToday } from '@/core/hooks/useToday'
import { toast } from '@/core/components/ui/toast'
import { useQuickAdd } from '@/core/quickAdd/context'
import { answerWord, englishKeys, fetchLevels, fetchReview, fetchStats, type Word } from '@/modules/english/api/english'
import { useEnglishT, useLevelName } from '@/modules/english/i18n'
import s from '../EnglishPages.module.scss'
import r from './ReviewPage.module.scss'

type Result = 'remembered' | 'forgot'

const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window

function speak(word: string) {
  if (!canSpeak()) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(word)
  u.lang = 'en-US'
  window.speechSynthesis.speak(u)
}

/**
 * English → Review, as a focus mode: the rest of the app steps aside, one
 * card at a time with a progress bar on top and the two answers at the
 * bottom in thumb reach. Space shows the answer; 1 and 2 answer; Esc leaves.
 * When the stack is done, a summary says how it went.
 */
export function ReviewPage() {
  const today = useToday()
  const t = useEnglishT()
  const levelLabel = useLevelName()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const quickAdd = useQuickAdd()
  // Which card's answer is showing; a new card always starts hidden.
  const [revealedId, setRevealedId] = useState<string | null>(null)
  // This session's answers, for the progress bar and the summary.
  const [answered, setAnswered] = useState<Record<Result, number>>({ remembered: 0, forgot: 0 })

  const { data: stack = [], isLoading, isError, refetch } = useQuery({
    queryKey: englishKeys.review(today),
    queryFn: () => fetchReview(today),
  })
  const { data: levels = [] } = useQuery({ queryKey: englishKeys.levels, queryFn: fetchLevels })

  const answer = useMutation({
    mutationFn: ({ word, result }: { word: Word; result: Result }) => answerWord(word.id, result, today),
    // Take the card off the stack straight away, so the next one shows at once
    // (and hidden) instead of the answered one coming back while the request runs.
    onMutate: ({ word, result }) => {
      setAnswered((a) => ({ ...a, [result]: a[result] + 1 }))
      qc.setQueryData<Word[]>(englishKeys.review(today), (stack) => stack?.filter((w) => w.id !== word.id))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: englishKeys.all }),
    onError: async (_e, { result }) => {
      setAnswered((a) => ({ ...a, [result]: a[result] - 1 }))
      await refetch()
      toast(t.review.saveFailed, 'error')
    },
  })

  const current = stack[0]
  const revealed = current !== undefined && revealedId === current.id
  const level = current && levels.find((l) => l.id === current.levelId)
  // Only the starting level: "remembered" has nowhere to move a word to.
  const noLevels = levels.length === 1
  const done = answered.remembered + answered.forgot
  const total = done + stack.length
  const sessionOver = !current && done > 0

  const { data: stats } = useQuery({
    queryKey: englishKeys.stats(today),
    queryFn: () => fetchStats(today),
    enabled: sessionOver,
  })

  const reply = (result: Result) => {
    if (current && revealed && !answer.isPending) answer.mutate({ word: current, result })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'Escape') return navigate('/english')
      if (!current) return
      if ((e.key === ' ' || e.key === 'Enter') && !revealed) {
        e.preventDefault()
        setRevealedId(current.id)
      } else if (e.key === '1') reply('forgot')
      else if (e.key === '2') reply('remembered')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (isError) {
    return (
      <div className={s.page}>
        <EmptyState title={t.review.failed} action={{ label: t.retry, icon: RefreshCw, onClick: () => void refetch() }} />
      </div>
    )
  }

  if (isLoading) return <div className={s.page} />

  if (sessionOver) {
    return (
      <div className={s.page}>
        <section className={r.summary} aria-label={t.review.doneTitle}>
          <div className={r.summaryGlyph} aria-hidden>
            🎉
          </div>
          <h1 className={r.summaryTitle}>{t.review.doneTitle}</h1>
          <p className={r.summarySub}>{t.review.doneSub(answered.remembered, answered.forgot)}</p>
          {stats && (
            <div className={r.summaryFacts}>
              {stats.streak > 0 && (
                <span className={r.streak}>
                  <Flame size={16} aria-hidden /> {t.review.streak(stats.streak)}
                </span>
              )}
              <span>{t.review.tomorrow(stats.upcoming[0]?.count ?? 0)}</span>
            </div>
          )}
          <div className={r.summaryActions}>
            <Link to="/" className={r.primary}>
              {t.review.home}
            </Link>
            <button type="button" className={r.secondary} onClick={() => quickAdd.open('english.word')}>
              <Plus size={18} aria-hidden /> {t.review.addWord}
            </button>
          </div>
        </section>
      </div>
    )
  }

  if (!current) {
    return (
      <div className={s.page}>
        <EmptyState
          title={t.nothingToday}
          description={t.review.emptySub}
          action={{ label: t.review.addWord, icon: Plus, onClick: () => quickAdd.open('english.word') }}
        />
      </div>
    )
  }

  return (
    <div className={r.focus}>
      <header className={r.top}>
        <Link to="/english" className={r.close} aria-label={t.review.close}>
          <X size={22} />
        </Link>
        <ProgressBar className={r.bar} value={done} max={total} label={t.review.progress(done, total)} />
        <span className={r.toGo}>{t.review.toGo(stack.length)}</span>
      </header>

      {noLevels && (
        <Link to="/english/settings" className={r.hint}>
          {t.review.addLevels}
        </Link>
      )}

      <div className={r.stage}>
        <div
          className={clsx(r.card, revealed && r.flipped)}
          onClick={() => !revealed && setRevealedId(current.id)}
        >
          {level && <span className={r.level}>{levelLabel(level)}</span>}
          <div className={r.word}>{current.word}</div>
          {canSpeak() && (
            <button
              type="button"
              className={r.listen}
              onClick={(e) => {
                e.stopPropagation()
                speak(current.word)
              }}
              aria-label={t.review.listen}
            >
              <Volume2 size={20} />
            </button>
          )}
          {revealed ? (
            <div className={r.answer}>
              <div className={r.translation}>{current.translation}</div>
              {current.note && <div className={r.note}>{current.note}</div>}
            </div>
          ) : (
            <div className={r.tapHint}>{t.review.tapToFlip}</div>
          )}
        </div>
      </div>

      <footer className={r.bottom}>
        {revealed ? (
          <div className={r.actions}>
            <button className={r.forgot} disabled={answer.isPending} onClick={() => reply('forgot')}>
              {t.review.forgot}
            </button>
            <button className={r.remembered} disabled={answer.isPending} onClick={() => reply('remembered')}>
              {t.review.remembered}
            </button>
          </div>
        ) : (
          <button className={r.show} onClick={() => setRevealedId(current.id)}>
            {t.review.show}
          </button>
        )}
        <p className={r.keys}>{t.review.keys}</p>
      </footer>
    </div>
  )
}
