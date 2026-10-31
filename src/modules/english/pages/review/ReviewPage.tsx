import { useState } from 'react'
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
  const [revealed, setRevealed] = useState(false)

  const { data: stack = [], isLoading, isError, refetch } = useQuery({
    queryKey: englishKeys.review(today),
    queryFn: () => fetchReview(today),
  })
  const { data: levels = [] } = useQuery({ queryKey: englishKeys.levels, queryFn: fetchLevels })

  const answer = useMutation({
    mutationFn: ({ word, result }: { word: Word; result: 'remembered' | 'forgot' }) =>
      answerWord(word.id, result, today),
    onSuccess: async () => {
      setRevealed(false)
      await qc.invalidateQueries({ queryKey: englishKeys.all })
    },
    onError: async () => {
      await refetch()
      toast('Could not save the answer', 'error')
    },
  })

  const current = stack[0]
  const level = current && levels.find((l) => l.id === current.levelId)

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
          <button className={r.show} onClick={() => setRevealed(true)}>
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
