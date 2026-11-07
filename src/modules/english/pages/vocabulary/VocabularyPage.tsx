import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { BookOpen, FileSpreadsheet, Plus, RefreshCw, Search } from 'lucide-react'
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
  type WordFilters,
} from '@/modules/english/api/english'
import { reviewLabel } from '@/modules/english/lib/review'
import { useWordEditor } from '@/modules/english/useWordEditor'
import { useEnglishT, useGroupName, useLevelName } from '@/modules/english/i18n'
import { shelve } from '@/modules/english/lib/tags'
import s from '../EnglishPages.module.scss'
import v from './VocabularyPage.module.scss'

/** English → Vocabulary: every word, with its level and the day it comes up. */
export function VocabularyPage() {
  const today = useToday()
  const t = useEnglishT()
  const levelLabel = useLevelName()
  const editor = useWordEditor()
  const quickAdd = useQuickAdd()
  const [filters, setFilters] = useState<WordFilters>({})
  const search = useDebouncedValue(filters.search, 300)
  const query = { ...filters, search: search?.trim() || undefined }

  const { data: words = [], isLoading, isError, refetch } = useQuery({
    queryKey: englishKeys.words(query),
    queryFn: () => fetchWords(query),
  })
  const { data: levels = [] } = useQuery({ queryKey: englishKeys.levels, queryFn: fetchLevels })
  const groupName = useGroupName()
  const { data: tags = [] } = useQuery({ queryKey: englishKeys.tags(today), queryFn: () => fetchTags(today) })
  const { data: groups = [] } = useQuery({ queryKey: englishKeys.groups, queryFn: fetchGroups })
  const tagNames = new Map(tags.map((tg) => [tg.id, tg.name]))

  const levelName = (id: string) => {
    const level = levels.find((l) => l.id === id)
    return level ? levelLabel(level) : ''
  }
  const filtered = Boolean(query.search || query.tagId)

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
        {tags.length > 0 && (
          <div className={v.filters}>
            <select
              className={v.select}
              value={filters.tagId ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, tagId: e.target.value || undefined }))}
              aria-label={t.vocab.tagFilter}
            >
              <option value="">{t.vocab.allTags}</option>
              {shelve(tags, groups).map((shelf) => (
                <optgroup key={shelf.group?.id ?? 'none'} label={groupName(shelf.group)}>
                  {shelf.tags.map((tg) => (
                    <option key={tg.id} value={tg.id}>
                      {tg.name} ({tg.count})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        )}
        <Link to="/english/import" className={v.importBtn}>
          <FileSpreadsheet size={16} aria-hidden /> {t.imp.open}
        </Link>
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
            <div className={v.head} aria-hidden>
              <span>{t.word.word}</span>
              <span>{t.word.translation}</span>
              <span>{t.word.level}</span>
              <span>{t.word.tags}</span>
              <span>{t.word.memoriseOn}</span>
            </div>
            {words.map((w) => {
              const due = w.reviewOn <= today
              const wordTags = w.tagIds.map((id) => tagNames.get(id)).filter(Boolean).join(', ')
              return (
                <button key={w.id} className={v.row} onClick={() => editor.openEdit(w)}>
                  <span className={v.main}>
                    <span className={v.word}>{w.word}</span>
                    <span className={v.translation}>{w.translation}</span>
                  </span>
                  <span className={v.meta}>
                    <span className={v.badge}>{levelName(w.levelId)}</span>
                    {/* Always there, even empty, so the desktop columns stay aligned. */}
                    <span className={v.tags}>{wordTags}</span>
                    <span className={due ? v.due : undefined}>{reviewLabel(w.reviewOn, today, t)}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {editor.dialog}
    </div>
  )
}
