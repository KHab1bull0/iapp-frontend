import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Flame, Layers, Plus, RefreshCw, Tag as TagIcon, Volume2, X } from 'lucide-react'
import { EmptyState } from '@/core/components/ui/EmptyState'
import { ProgressBar } from '@/core/components/ui/Progress'
import { SegmentedControl } from '@/core/components/ui/SegmentedControl'
import { useToday } from '@/core/hooks/useToday'
import { toast } from '@/core/components/ui/toast'
import { useQuickAdd } from '@/core/quickAdd/context'
import {
  answerWord,
  englishKeys,
  fetchGroups,
  fetchLevels,
  fetchReview,
  fetchStats,
  fetchTags,
  type Level,
  type Tag,
  type Word,
} from '@/modules/english/api/english'
import { useEnglishT, useGroupName, useLevelName } from '@/modules/english/i18n'
import { shelve } from '@/modules/english/lib/tags'
import { frontSide, loadDirection, saveDirection, type Direction } from '@/modules/english/lib/direction'
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
 * card at a time with a progress bar on top. Once the answer shows, every
 * level is laid out as a chip at the bottom, in thumb reach: the user puts
 * the word where they think it belongs, and the next card comes up at once.
 * New means "not yet" (back today, counted as forgot). Space shows the
 * answer; 1, 2, 3… pick a level; Esc leaves. A summary closes the stack.
 */
export function ReviewPage() {
  const today = useToday()
  const [params] = useSearchParams()
  const tag = params.get('tag')
  const { data: tags, isLoading } = useQuery({ queryKey: englishKeys.tags(today), queryFn: () => fetchTags(today) })

  if (isLoading) return null
  // The tag cards come first once a tag has words; until then, straight in.
  const worn = (tags ?? []).some((tg) => tg.count > 0)
  if (!tag && worn) return <TagChooser tags={tags ?? []} />
  const tagId = tag && tag !== 'all' ? tag : undefined
  return <ReviewSession key={tag ?? 'all'} tagId={tagId} tagName={tags?.find((tg) => tg.id === tagId)?.name} />
}

/** One review session over today's stack, or one tag's part of it. */
function ReviewSession({ tagId, tagName }: { tagId?: string; tagName?: string }) {
  const today = useToday()
  const t = useEnglishT()
  const levelLabel = useLevelName()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const quickAdd = useQuickAdd()
  // Which card's answer is showing; a new card always starts hidden.
  const [revealedId, setRevealedId] = useState<string | null>(null)
  // English first, Uzbek first, or a mix; remembered on this device.
  const [direction, setDirection] = useState<Direction>(loadDirection)
  // This session's answers, for the progress bar and the summary.
  const [answered, setAnswered] = useState<Record<Result, number>>({ remembered: 0, forgot: 0 })

  const { data: stack = [], isLoading, isError, refetch } = useQuery({
    queryKey: englishKeys.review(today, tagId),
    queryFn: () => fetchReview(today, tagId),
  })
  const { data: levels = [] } = useQuery({ queryKey: englishKeys.levels, queryFn: fetchLevels })

  // As the server counts it: up a level is remembered; the same or lower, forgot.
  const resultOf = (word: Word, level: Level): Result => {
    const from = levels.find((l) => l.id === word.levelId)?.intervalDays ?? 0
    return level.intervalDays > from ? 'remembered' : 'forgot'
  }
  const answer = useMutation({
    mutationFn: ({ word, level }: { word: Word; level: Level }) => answerWord(word.id, level.id, today),
    // Take the card off the stack straight away, so the next one shows at once
    // (and hidden) instead of the answered one coming back while the request runs.
    onMutate: ({ word, level }) => {
      const result = resultOf(word, level)
      setAnswered((a) => ({ ...a, [result]: a[result] + 1 }))
      qc.setQueryData<Word[]>(englishKeys.review(today, tagId), (stack) => stack?.filter((w) => w.id !== word.id))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: englishKeys.all }),
    onError: async (_e, { word, level }) => {
      const result = resultOf(word, level)
      setAnswered((a) => ({ ...a, [result]: a[result] - 1 }))
      await refetch()
      toast(t.review.saveFailed, 'error')
    },
  })

  const current = stack[0]
  const side = current ? frontSide(direction, current.id) : 'en'
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

  const choose = (target: Level | undefined) => {
    if (current && revealed && target && !answer.isPending) answer.mutate({ word: current, level: target })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      // Out to the tag cards when a tag was picked, else out of review.
      if (e.key === 'Escape') return navigate(tagId ? '/english/review' : '/english')
      if (!current) return
      if ((e.key === ' ' || e.key === 'Enter') && !revealed) {
        e.preventDefault()
        setRevealedId(current.id)
      } else if (/^[1-9]$/.test(e.key)) choose(levels[Number(e.key) - 1])
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
            {tagId ? (
              <Link to="/english/review" className={r.primary}>
                <TagIcon size={18} aria-hidden /> {t.review.otherTag}
              </Link>
            ) : (
              <Link to="/" className={r.primary}>
                {t.review.home}
              </Link>
            )}
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

      <div className={r.mode}>
        {tagName && (
          <span className={r.tagChip}>
            <TagIcon size={14} aria-hidden /> {tagName}
          </span>
        )}
        <SegmentedControl
          size="sm"
          label={t.review.direction}
          value={direction}
          onChange={(d) => {
            setDirection(d)
            saveDirection(d)
            setRevealedId(null) // the card turns back to its (new) front
          }}
          options={[
            { value: 'en-uz', label: t.review.enUz },
            { value: 'uz-en', label: t.review.uzEn },
            { value: 'mixed', label: t.review.mixed },
          ]}
        />
      </div>

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
          {side === 'en' ? (
            <>
              <div className={r.word} lang="en">
                {current.word}
              </div>
              {/* A hint in English, before the translation: recall the word from its meaning. */}
              {current.description && (
                <p className={r.description} lang="en">
                  {current.description}
                </p>
              )}
            </>
          ) : (
            // Uzbek first: recall the English word. Its note waits for the
            // answer, as it may name the word.
            <div className={r.word}>{current.translation}</div>
          )}
          {/* Hearing the word would give it away while the Uzbek side is up. */}
          {canSpeak() && (side === 'en' || revealed) && (
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
              {side === 'en' ? (
                <div className={r.translation}>{current.translation}</div>
              ) : (
                <>
                  <div className={r.translation} lang="en">
                    {current.word}
                  </div>
                  {current.description && (
                    <p className={r.description} lang="en">
                      {current.description}
                    </p>
                  )}
                </>
              )}
              {current.note && <div className={r.note}>{current.note}</div>}
              {current.example && (
                <p className={r.example} lang="en">
                  “{current.example}”
                </p>
              )}
            </div>
          ) : (
            <div className={r.tapHint}>{t.review.tapToFlip}</div>
          )}
        </div>
      </div>

      <footer className={r.bottom}>
        {revealed ? (
          <div className={r.levels} role="group" aria-labelledby="review-pick-level">
            <p id="review-pick-level" className={r.levelsLabel}>
              {t.review.pickLevel}
            </p>
            <div className={r.chips}>
              {levels.map((l, i) => {
                const when = l.locked ? t.review.again : t.days(l.intervalDays)
                const isCurrent = l.id === current.levelId
                return (
                  <button
                    key={l.id}
                    type="button"
                    className={clsx(r.chip, l.locked && r.chipAgain, isCurrent && r.chipCurrent)}
                    disabled={answer.isPending}
                    onClick={() => choose(l)}
                    aria-label={t.review.levelChip(levelLabel(l), when)}
                    aria-keyshortcuts={i < 9 ? String(i + 1) : undefined}
                    title={isCurrent ? t.review.current : undefined}
                  >
                    <span className={r.chipName}>{levelLabel(l)}</span>
                    {/* A level named after its interval ("3 kun") needs no second line. */}
                    {levelLabel(l) !== when && <span className={r.chipWhen}>{when}</span>}
                  </button>
                )
              })}
            </div>
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

/**
 * Before review: what to review. "All" first, then each tag by group, each
 * card with how many of its words are due today and how many it has in all.
 * A tag with nothing due today can't be opened.
 */
function TagChooser({ tags }: { tags: Tag[] }) {
  const t = useEnglishT()
  const today = useToday()
  const navigate = useNavigate()
  const groupName = useGroupName()
  const { data: groups = [] } = useQuery({ queryKey: englishKeys.groups, queryFn: fetchGroups })
  const { data: all = [] } = useQuery({ queryKey: englishKeys.review(today), queryFn: () => fetchReview(today) })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && navigate('/english')
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])

  const card = (key: string, name: string, due: number, total: number | null, to: string, icon = TagIcon) => {
    const Icon = icon
    const body = (
      <>
        <span className={r.tagCardIcon} aria-hidden>
          <Icon size={18} />
        </span>
        <span className={r.tagCardName}>{name}</span>
        <span className={clsx(r.tagCardDue, due > 0 && r.tagCardDueOn)}>{t.review.dueToday(due)}</span>
        {total !== null && <span className={r.tagCardTotal}>{t.review.ofTotal(total)}</span>}
      </>
    )
    const label = total === null ? `${name}: ${t.review.dueToday(due)}` : t.review.tagCard(name, due, total)
    return due > 0 ? (
      <Link key={key} to={to} className={r.tagCard} aria-label={label}>
        {body}
      </Link>
    ) : (
      <div key={key} className={clsx(r.tagCard, r.tagCardOff)} aria-label={label} aria-disabled>
        {body}
      </div>
    )
  }

  return (
    <div className={s.page}>
      <header className={r.chooserHead}>
        <h1 className={r.chooserTitle}>{t.review.pickTag}</h1>
        <p className={r.chooserSub}>{t.review.pickTagSub}</p>
      </header>
      <div className={r.tagGrid}>{card('all', t.review.allTags, all.length, null, '/english/review?tag=all', Layers)}</div>
      {shelve(
        tags.filter((tg) => tg.count > 0),
        groups,
      ).map((shelf) => (
        <section key={shelf.group?.id ?? 'none'} className={s.section} aria-label={groupName(shelf.group)}>
          <div className={s.sectionHead}>
            <h2 className={s.sectionTitle}>{groupName(shelf.group)}</h2>
          </div>
          <div className={r.tagGrid}>
            {shelf.tags.map((tg) => card(tg.id, tg.name, tg.due, tg.count, `/english/review?tag=${tg.id}`))}
          </div>
        </section>
      ))}
    </div>
  )
}
