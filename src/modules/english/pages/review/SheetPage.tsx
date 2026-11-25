import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { RefreshCw, ScrollText, Volume2 } from 'lucide-react'
import { BackButton } from '@/core/components/BackButton'
import { EmptyState } from '@/core/components/ui/EmptyState'
import { useToday } from '@/core/hooks/useToday'
import { englishKeys, fetchLevels, fetchReview, fetchTags } from '@/modules/english/api/english'
import { useEnglishT, useLevelName } from '@/modules/english/i18n'
import { useExtraNew } from '@/modules/english/lib/extraNew'
import { canSpeak, speak } from '@/modules/english/lib/speak'
import { Skeleton } from '@/core/components/ui/Skeleton'
import { Loading } from '@/modules/english/components/Loading'
import s from './SheetPage.module.scss'

/**
 * English → Memorise → Preview: all of today's words in full, to read before
 * the cards, like reading a sheet. Same stack as the cards. The only way out
 * is back: nothing here leads to another page.
 */
export function SheetPage() {
  const t = useEnglishT()
  const today = useToday()
  const navigate = useNavigate()
  const levelLabel = useLevelName()
  const [extraNew] = useExtraNew(today)
  const { data: words = [], isLoading, isError, refetch } = useQuery({
    queryKey: englishKeys.review(today, undefined, extraNew),
    queryFn: () => fetchReview(today, undefined, extraNew),
  })
  const { data: levels = [] } = useQuery({ queryKey: englishKeys.levels, queryFn: fetchLevels })
  const { data: tags = [] } = useQuery({
    queryKey: englishKeys.tags(today, extraNew),
    queryFn: () => fetchTags(today, extraNew),
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && navigate('/english/review')
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])

  const levelOf = (id: string | null) => {
    const level = id ? levels.find((l) => l.id === id) : levels.find((l) => l.locked)
    return level ? levelLabel(level) : null
  }

  return (
    <div className={s.page}>
      <BackButton fallback="/english/review" className={s.back} label={t.sheet.back} />
      <h1 className={s.title}>{isLoading || isError ? t.review.sheetCard : t.sheet.title(words.length)}</h1>
      {isError ? (
        <EmptyState
          title={t.sheet.loadFailed}
          action={{ label: t.retry, icon: RefreshCw, onClick: () => void refetch() }}
        />
      ) : isLoading ? (
        <Loading label={t.loading} className={s.list}>
          {[0, 1, 2].map((n) => (
            <Skeleton key={n} height={120} radius={12} />
          ))}
        </Loading>
      ) : words.length === 0 ? (
        <EmptyState icon={ScrollText} title={t.sheet.empty} />
      ) : (
        <div className={s.list}>
          {words.map((w) => {
            const names = w.tagIds.map((id) => tags.find((tg) => tg.id === id)?.name).filter(Boolean)
            return (
              <article key={w.id} className={s.card} aria-label={w.word}>
                <header className={s.head}>
                  <span className={s.word}>{w.word}</span>
                  {canSpeak() && (
                    <button type="button" className={s.listen} onClick={() => speak(w.word)} aria-label={t.sheet.listen(w.word)}>
                      <Volume2 size={18} />
                    </button>
                  )}
                  <span className={s.meta}>
                    {[levelOf(w.levelId), ...names].filter(Boolean).map((m, i) => (
                      <span key={i} className={s.chip}>
                        {m}
                      </span>
                    ))}
                  </span>
                </header>
                <div className={s.translation}>{w.translation}</div>
                {w.description && <div className={s.description}>{w.description}</div>}
                {w.example && <div className={s.example}>“{w.example}”</div>}
                {w.note && (
                  <div className={s.note}>
                    <span className={s.noteLabel}>{t.sheet.note}</span> {w.note}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
