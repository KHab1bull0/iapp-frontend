import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { useToday } from '@/core/hooks/useToday'
import { toast } from '@/core/components/ui/toast'
import { answerWord, englishKeys, fetchLevels, fetchReview, type Word } from '@/modules/english/api/english'
import s from '../EnglishPages.module.scss'
import r from './ReviewPage.module.scss'

/**
 * English → Review: the stack of words whose day has come, one card at a
 * time. Look at the word, recall it, then show the answer and say how it went.
 */
export function ReviewPage() {
  const today = useToday()
  const qc = useQueryClient()
  // Which card's answer is showing; a new card always starts hidden.
  const [revealedId, setRevealedId] = useState<string | null>(null)

  const { data: stack = [], isLoading, isError, refetch } = useQuery({
    queryKey: englishKeys.review(today),
    queryFn: () => fetchReview(today),
  })
  const { data: levels = [] } = useQuery({ queryKey: englishKeys.levels, queryFn: fetchLevels })

  const answer = useMutation({
    mutationFn: ({ word, result }: { word: Word; result: 'remembered' | 'forgot' }) =>
      answerWord(word.id, result, today),
    // Take the card off the stack straight away, so the next one shows at once
    // (and hidden) instead of the answered one coming back while the request runs.
    onMutate: ({ word }) => {
      qc.setQueryData<Word[]>(englishKeys.review(today), (stack) => stack?.filter((w) => w.id !== word.id))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: englishKeys.all }),
    onError: async () => {
      await refetch()
      toast('Could not save the answer', 'error')
    },
  })

  const current = stack[0]
  const revealed = current !== undefined && revealedId === current.id
  const level = current && levels.find((l) => l.id === current.levelId)
  // Only the starting level: "remembered" has nowhere to move a word to.
  const noLevels = levels.length === 1

  if (isError) {
    return (
      <div className={s.page}>
        <div className={s.empty}>
          <div className={s.emptyTitle}>Failed to load the stack</div>
          <button className={s.btnSecondary} onClick={() => refetch()}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) return <div className={s.page} />

  if (!current) {
    return (
      <div className={s.page}>
        <div className={s.empty}>
          <div className={s.emptyTitle}>Nothing to memorise today</div>
          <div className={s.emptySub}>Words join the stack on their day.</div>
        </div>
      </div>
    )
  }

  return (
    <div className={s.page}>
      {noLevels && (
        <Link to="/english/settings" className={r.hint}>
          Add review levels in English settings, so remembered words leave the stack for a while.
        </Link>
      )}
      <div className={r.progress}>{stack.length} to go</div>

      <div className={r.card}>
        {level && <span className={r.level}>{level.name}</span>}
        <div className={r.word}>{current.word}</div>

        {revealed ? (
          <div className={r.answer}>
            <div className={r.translation}>{current.translation}</div>
            {current.note && <div className={r.note}>{current.note}</div>}
          </div>
        ) : (
          <button className={r.show} onClick={() => setRevealedId(current.id)}>
            Show
          </button>
        )}
      </div>

      {revealed && (
        <div className={r.actions}>
          <button
            className={r.forgot}
            disabled={answer.isPending}
            onClick={() => answer.mutate({ word: current, result: 'forgot' })}
          >
            Forgot
          </button>
          <button
            className={r.remembered}
            disabled={answer.isPending}
            onClick={() => answer.mutate({ word: current, result: 'remembered' })}
          >
            Remembered
          </button>
        </div>
      )}
    </div>
  )
}
