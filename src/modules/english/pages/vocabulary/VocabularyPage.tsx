import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, RefreshCw, Search } from 'lucide-react'
import { useToday } from '@/core/hooks/useToday'
import { useDebouncedValue } from '@/core/hooks/useDebouncedValue'
import {
  englishKeys,
  fetchCategories,
  fetchLevels,
  fetchWords,
  type WordFilters,
} from '@/modules/english/api/english'
import { reviewLabel } from '@/modules/english/lib/review'
import { useWordEditor } from '@/modules/english/useWordEditor'
import s from '../EnglishPages.module.scss'
import v from './VocabularyPage.module.scss'

/** English → Vocabulary: every word, with its level and the day it comes up. */
export function VocabularyPage() {
  const today = useToday()
  const editor = useWordEditor()
  const [filters, setFilters] = useState<WordFilters>({})
  const search = useDebouncedValue(filters.search, 300)
  const query = { ...filters, search: search?.trim() || undefined }

  const { data: words = [], isLoading, isError, refetch } = useQuery({
    queryKey: englishKeys.words(query),
    queryFn: () => fetchWords(query),
  })
  const { data: levels = [] } = useQuery({ queryKey: englishKeys.levels, queryFn: fetchLevels })
  const { data: categories = [] } = useQuery({ queryKey: englishKeys.categories, queryFn: fetchCategories })

  const levelName = (id: string) => levels.find((l) => l.id === id)?.name ?? ''
  const categoryName = (id: string | null) => (id ? categories.find((c) => c.id === id)?.name : undefined)
  const filtered = Boolean(query.search || query.categoryId)

  return (
    <div className={s.page}>
      <div className={v.toolbar}>
        <div className={v.search}>
          <Search size={15} />
          <input
            type="search"
            className={v.searchInput}
            placeholder="Search words"
            value={filters.search ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value || undefined }))}
            aria-label="Search words"
          />
        </div>
        {categories.length > 0 && (
          <div className={v.filters}>
            <select
              className={v.select}
              value={filters.categoryId ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, categoryId: e.target.value || undefined }))}
              aria-label="Category filter"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {isError ? (
        <div className={s.empty}>
          <div className={s.emptyTitle}>Failed to load words</div>
          <button className={s.btnSecondary} onClick={() => refetch()}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : isLoading ? null : words.length === 0 ? (
        <div className={s.empty}>
          <div className={s.emptyTitle}>{filtered ? 'No words match' : 'No words yet'}</div>
          {!filtered && <div className={s.emptySub}>Add your first word with the + button.</div>}
        </div>
      ) : (
        <section className={s.section}>
          <div className={s.sectionHead}>
            <h2 className={s.sectionTitle}>Words</h2>
            <span className={s.count}>{words.length}</span>
          </div>
          <div className={s.list}>
            {words.map((w) => {
              const due = w.reviewOn <= today
              const category = categoryName(w.categoryId)
              return (
                <button key={w.id} className={v.row} onClick={() => editor.openEdit(w)}>
                  <span className={v.main}>
                    <span className={v.word}>{w.word}</span>
                    <span className={v.translation}>{w.translation}</span>
                  </span>
                  <span className={v.meta}>
                    <span className={v.badge}>{levelName(w.levelId)}</span>
                    {category && <span>{category}</span>}
                    <span className={due ? v.due : undefined}>{reviewLabel(w.reviewOn, today)}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {editor.dialog}
      <button className={s.fab} onClick={editor.openNew} aria-label="Add word">
        <Plus size={22} />
      </button>
    </div>
  )
}
