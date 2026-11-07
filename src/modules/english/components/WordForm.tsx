import { useState, type FormEvent } from 'react'
import clsx from 'clsx'
import { Check } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { todayYmd, ymd } from '@/core/lib/format'
import { toast } from '@/core/components/ui/toast'
import { ConfirmDialog } from '@/core/components/ui/ConfirmDialog'
import {
  createWord,
  deleteWord,
  englishKeys,
  fetchCategories,
  fetchLevels,
  updateWord,
  type Word,
  type WordInput,
} from '@/modules/english/api/english'
import { useEnglishT, useLevelName } from '@/modules/english/i18n'
import s from './WordForm.module.scss'
import { DateField } from '@/core/components/ui/DateField'

interface Props {
  word: Word | null
  onSaved: () => void
  onCancel: () => void
}

interface ApiError {
  response?: { status?: number; data?: { message?: string | string[] } }
}

export function WordForm({ word, onSaved, onCancel }: Props) {
  const t = useEnglishT()
  const levelLabel = useLevelName()
  const qc = useQueryClient()
  const [text, setText] = useState(word?.word ?? '')
  const [translation, setTranslation] = useState(word?.translation ?? '')
  const [note, setNote] = useState(word?.note ?? '')
  const [description, setDescription] = useState(word?.description ?? '')
  const [example, setExample] = useState(word?.example ?? '')
  const [categoryId, setCategoryId] = useState(word?.categoryId ?? '')
  const [reviewOn, setReviewOn] = useState(word?.reviewOn ?? todayYmd())
  const [levelId, setLevelId] = useState(word?.levelId ?? '')

  // The picker only appears once there is a category to pick.
  const { data: categories = [] } = useQuery({
    queryKey: englishKeys.categories,
    queryFn: fetchCategories,
  })

  const { data: levels = [] } = useQuery({ queryKey: englishKeys.levels, queryFn: fetchLevels })
  // A new word starts at New (the locked level) unless another is picked.
  const shownLevelId = levelId || levels.find((l) => l.locked)?.id || ''

  // Moving a word to a level reschedules it as review would: today + that level's days.
  function chooseLevel(id: string) {
    setLevelId(id)
    const level = levels.find((l) => l.id === id)
    if (level) {
      const d = new Date()
      d.setDate(d.getDate() + level.intervalDays)
      setReviewOn(ymd(d))
    }
  }

  // Chips, as for a transaction's category: every choice in view, one tap.
  const categoryPicker = categories.length > 0 && (
    <div className={s.field}>
      <span className={s.label} id="word-category-label">
        {t.word.category}
      </span>
      <div className={s.chips} role="radiogroup" aria-labelledby="word-category-label">
        {[{ id: '', name: t.word.none }, ...categories].map((c) => {
          const on = categoryId === c.id
          return (
            <button
              key={c.id || 'none'}
              type="button"
              role="radio"
              aria-checked={on}
              className={clsx(s.chip, on && s.chipOn)}
              onClick={() => setCategoryId(c.id)}
            >
              {on && <Check size={14} strokeWidth={2.5} aria-hidden />}
              {c.name}
            </button>
          )
        })}
      </div>
    </div>
  )

  const valid = text.trim() && translation.trim() && reviewOn

  const save = useMutation({
    mutationFn: () => {
      const input: WordInput = {
        word: text.trim(),
        translation: translation.trim(),
        note: note.trim() || null,
        description: description.trim() || null,
        example: example.trim() || null,
        categoryId: categoryId || null,
        reviewOn,
        ...(shownLevelId ? { levelId: shownLevelId } : {}),
      }
      return word ? updateWord(word.id, input) : createWord(input)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: englishKeys.all })
      toast(word ? t.word.updated : t.word.added, 'success')
      onSaved()
    },
    onError: (err) => {
      const e = err as ApiError
      toast(e.response?.status === 409 ? t.word.exists : t.word.saveFailed, 'error')
    },
  })

  const remove = useMutation({
    mutationFn: () => deleteWord(word!.id),
    onSuccess: async () => {
      qc.removeQueries({ queryKey: englishKeys.word(word!.id) })
      await qc.invalidateQueries({ queryKey: englishKeys.all })
      toast(t.word.deleted, 'success')
      onSaved()
    },
    onError: () => toast(t.word.deleteFailed, 'error'),
  })

  function submit(e: FormEvent) {
    e.preventDefault()
    if (valid && !save.isPending) save.mutate()
  }

  return (
    <form className={s.form} onSubmit={submit}>
      <div className={s.row}>
        <label className={s.field}>
          <span className={s.label}>{t.word.word}</span>
          <input
            className={s.input}
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={100}
            placeholder={t.word.wordPlaceholder}
            aria-label={t.word.word}
            autoFocus={!word}
            autoCapitalize="none"
          />
        </label>
        <label className={s.field}>
          <span className={s.label}>{t.word.translation}</span>
          <input
            className={s.input}
            value={translation}
            onChange={(e) => setTranslation(e.target.value)}
            maxLength={200}
            placeholder={t.word.translationPlaceholder}
            aria-label={t.word.translation}
          />
        </label>
      </div>

      <label className={s.field}>
        <span className={s.label}>{t.word.description}</span>
        <textarea
          className={clsx(s.input, s.textarea)}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          rows={2}
          placeholder={t.word.descriptionPlaceholder}
          aria-label={t.word.description}
          aria-describedby="word-description-hint"
          lang="en"
        />
        <span id="word-description-hint" className={s.hint}>
          {t.word.descriptionHint}
        </span>
      </label>

      <label className={s.field}>
        <span className={s.label}>{t.word.example}</span>
        <input
          className={s.input}
          value={example}
          onChange={(e) => setExample(e.target.value)}
          maxLength={500}
          placeholder={t.word.examplePlaceholder}
          aria-label={t.word.example}
          lang="en"
        />
      </label>

      <label className={s.field}>
        <span className={s.label}>{t.word.note}</span>
        <textarea
          className={clsx(s.input, s.textarea)}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={1000}
          rows={2}
          placeholder={t.word.notePlaceholder}
          aria-label={t.word.note}
        />
      </label>

      <div className={s.row}>
        {levels.length > 0 && (
          <label className={s.field}>
            <span className={s.label}>{t.word.level}</span>
            <select
              className={s.input}
              value={shownLevelId}
              onChange={(e) => chooseLevel(e.target.value)}
              aria-label={t.word.level}
            >
              {levels.map((l) => (
                <option key={l.id} value={l.id}>
                  {levelLabel(l)} {l.locked ? '' : `· ${t.days(l.intervalDays)}`}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className={s.field}>
          <span className={s.label}>{t.word.memoriseOn}</span>
          <DateField label={t.word.memoriseOn} value={reviewOn} onChange={(d) => d && setReviewOn(d)} />
        </div>
      </div>
      {categoryPicker}
      <span className={s.hint}>
        {reviewOn ? t.word.joinsHint : t.word.pickDay}
      </span>

      <div data-form-actions>
        {word && (
          <ConfirmDialog
            trigger={
              <button type="button" className={s.btnDanger}>
                {t.delete}
              </button>
            }
            title={t.deleteTitle(word.word)}
            description={t.word.deleteDesc}
            confirmLabel={t.delete}
            cancelLabel={t.cancel}
            onConfirm={() => remove.mutate()}
          />
        )}
        <button type="button" className={s.btnSecondary} onClick={onCancel}>
          {t.cancel}
        </button>
        <button type="submit" className={s.btnPrimary} disabled={!valid || save.isPending}>
          {save.isPending ? t.saving : t.save}
        </button>
      </div>
    </form>
  )
}
