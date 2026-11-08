import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, Check, FileSpreadsheet, Plus, RefreshCw, Search, SlidersHorizontal } from 'lucide-react'
import { Sheet } from '@/core/components/ui/Sheet'
import { EmptyState } from '@/core/components/ui/EmptyState'
import { useQuickAdd } from '@/core/quickAdd/context'
import { useToday } from '@/core/hooks/useToday'
import { useDebouncedValue } from '@/core/hooks/useDebouncedValue'
import {
  englishKeys,
  fetchGroups,
  fetchLevels,
  fetchTags,
  fetchWords,
  type Word,
  type WordFilters,
} from '@/modules/english/api/english'
import { reviewLabel } from '@/modules/english/lib/review'
import { useWordEditor } from '@/modules/english/useWordEditor'
import { useEnglishT, useGroupName, useLevelName } from '@/modules/english/i18n'
import { shelve } from '@/modules/english/lib/tags'
import s from '../EnglishPages.module.scss'
import v from './VocabularyPage.module.scss'

/** One empty list, so "no data yet" is the same value every render. */
const NO_WORDS: Word[] = []

/** English → Vocabulary: every word, with its level and the day it comes up. */
export function VocabularyPage() {
  const today = useToday()
  const t = useEnglishT()
  const levelLabel = useLevelName()
  const editor = useWordEditor()
  const quickAdd = useQuickAdd()
  const [filters, setFilters] = useState<WordFilters>({})
  const [filtersOpen, setFiltersOpen] = useState(false)
  // The sheet's picks, applied only by its Search button.
  const [draft, setDraft] = useState<string[]>([])
  const applied = filters.tagIds ?? []
  const openFilters = () => {
    setDraft(applied)
    setFiltersOpen(true)
  }
  const toggleDraft = (id: string) => setDraft((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]))
  const search = useDebouncedValue(filters.search, 300)
  const query = { ...filters, search: search?.trim() || undefined }

  const { data: words = NO_WORDS, isLoading, isError, refetch } = useQuery({
    queryKey: englishKeys.words(query),
    queryFn: () => fetchWords(query),
  })
  const { data: levels = [] } = useQuery({ queryKey: englishKeys.levels, queryFn: fetchLevels })
  const groupName = useGroupName()
  const { data: tags = [] } = useQuery({ queryKey: englishKeys.tags(today), queryFn: () => fetchTags(today) })
  const { data: groups = [] } = useQuery({ queryKey: englishKeys.groups, queryFn: fetchGroups })
  const tagNames = new Map(tags.map((tg) => [tg.id, tg.name]))

  const levelName = (id: string | null) => {
    if (!id) return t.vocab.unlearned
    const level = levels.find((l) => l.id === id)
    return level ? levelLabel(level) : ''
  }
  const filtered = Boolean(query.search || applied.length)

  // A long vocabulary is drawn a page at a time: more as the list's end comes into view.
  const PAGE = 60
  const [shown, setShown] = useState(PAGE)
  const [shownFor, setShownFor] = useState(words)
  if (shownFor !== words) {
    setShownFor(words)
    setShown(PAGE)
  }
  const sentinel = useRef<HTMLDivElement>(null)
  const more = shown < words.length
  useEffect(() => {
    const el = sentinel.current
    if (!el || !more || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) setShown((n) => n + PAGE)
    }, { rootMargin: '600px' })
    io.observe(el)
    return () => io.disconnect()
  }, [more, shown])

  return (
    <div className={s.page}>
      <div className={v.toolbar}>
        <div className={v.search}>
          <Search size={15} />
          <input
            type="search"
            className={v.searchInput}
            data-page-search
            placeholder={t.vocab.search}
            value={filters.search ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value || undefined }))}
            aria-label={t.vocab.search}
          />
        </div>
        <button
          type="button"
          className={clsx(v.filterBtn, applied.length > 0 && v.filterOn)}
          onClick={openFilters}
          aria-label={applied.length ? t.vocab.filtersOn(applied.length) : t.vocab.filters}
          aria-haspopup="dialog"
        >
          <SlidersHorizontal size={18} aria-hidden />
          {applied.length > 0 && (
            <span className={v.filterCount} aria-hidden>
              {applied.length}
            </span>
          )}
        </button>
      </div>

      {isError ? (
        <EmptyState title={t.vocab.failed} action={{ label: t.retry, icon: RefreshCw, onClick: () => void refetch() }} />
      ) : isLoading ? null : words.length === 0 ? (
        <EmptyState
          icon={filtered ? Search : BookOpen}
          title={filtered ? t.vocab.noMatch : t.vocab.empty}
          description={filtered ? undefined : t.vocab.emptySub}
          action={filtered ? undefined : { label: t.vocab.add, icon: Plus, onClick: () => quickAdd.open('english.word') }}
          secondary={filtered ? undefined : { label: t.imp.open, icon: FileSpreadsheet, to: '/english/import' }}
        />
      ) : (
        <section className={s.section}>
          <div className={s.sectionHead}>
            <h2 className={s.sectionTitle}>{t.vocab.words}</h2>
            <span className={s.count}>{words.length}</span>
          </div>
          <div className={s.list}>
            {words.slice(0, shown).map((w) => {
              const due = w.reviewOn !== null && w.reviewOn <= today
              const wordTags = w.tagIds.map((id) => tagNames.get(id)).filter(Boolean).join(', ')
              return (
                <button key={w.id} className={v.row} onClick={() => editor.openEdit(w)}>
                  {/* The word always whole; its level beside it never squeezes it. */}
                  <span className={v.top}>
                    <span className={v.word} lang="en">
                      {w.word}
                    </span>
                    <span className={clsx(v.badge, !w.levelId && v.badgeQueued)}>{levelName(w.levelId)}</span>
                  </span>
                  <span className={v.translation}>{w.translation}</span>
                  {w.description && (
                    <span className={v.description} lang="en">
                      {w.description}
                    </span>
                  )}
                  <span className={v.foot}>
                    {wordTags && <span className={v.tags}>{wordTags}</span>}
                    <span className={clsx(v.when, due && v.due)}>
                      {w.reviewOn ? reviewLabel(w.reviewOn, today, t) : t.vocab.queued}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
          {more && <div ref={sentinel} className={v.sentinel} aria-hidden />}
        </section>
      )}

      {/* Everything but the search: from the filter button, a sheet from the bottom. */}
      <Sheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        title={t.vocab.filters}
        footer={
          <>
            <button type="button" className={v.clear} disabled={draft.length === 0} onClick={() => setDraft([])}>
              {t.vocab.clearFilters}
            </button>
            <button
              type="button"
              className={v.apply}
              onClick={() => {
                setFilters((f) => ({ ...f, tagIds: draft.length ? draft : undefined }))
                setFiltersOpen(false)
              }}
            >
              <Search size={18} aria-hidden /> {t.vocab.applyFilters}
            </button>
          </>
        }
      >
        <div className={v.filterBody}>
          <span className={v.filterLabel}>{t.vocab.tagFilter}</span>
          {tags.length > 0 && <p className={v.filterHint}>{t.vocab.filtersHint}</p>}
          {tags.length === 0 ? (
            <p className={v.filterEmpty}>{t.vocab.noTags}</p>
          ) : (
            shelve(tags, groups).map((shelf) => (
              <div key={shelf.group?.id ?? 'none'} className={v.shelf}>
                <span className={v.shelfName}>{groupName(shelf.group)}</span>
                <div className={v.chips} role="group" aria-label={groupName(shelf.group)}>
                  {shelf.tags.map((tg) => {
                    const on = draft.includes(tg.id)
                    return (
                      <button
                        key={tg.id}
                        type="button"
                        aria-pressed={on}
                        className={clsx(v.chip, on && v.chipOn)}
                        onClick={() => toggleDraft(tg.id)}
                      >
                        {on && <Check size={14} strokeWidth={2.5} aria-hidden />}
                        {tg.name}
                        <span className={v.chipCount}>{tg.count}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </Sheet>

      {editor.dialog}
    </div>
  )
}
