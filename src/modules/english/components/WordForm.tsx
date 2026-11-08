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
  fetchEnglishSettings,
  fetchLevels,
  updateWord,
  type Word,
  type WordInput,
} from '@/modules/english/api/english'
import { useEnglishT, useLevelName } from '@/modules/english/i18n'
import s from './WordForm.module.scss'
import { DateField } from '@/core/components/ui/DateField'
import { TagPicker } from './TagPicker'

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
  const [tagIds, setTagIds] = useState<string[]>(word?.tagIds ?? [])
  // '' = not learned yet: the word waits in the queue, with no day.
  const [levelId, setLevelId] = useState(word?.levelId ?? '')
  const [reviewOn, setReviewOn] = useState(word?.reviewOn ?? todayYmd())

  const { data: levels = [] } = useQuery({ queryKey: englishKeys.levels, queryFn: fetchLevels })
  const { data: settings } = useQuery({ queryKey: englishKeys.settings, queryFn: fetchEnglishSettings })

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

  const queued = levelId === ''
  const valid = text.trim() && translation.trim() && (queued || reviewOn)

  const save = useMutation({
    mutationFn: () => {
      const input: WordInput = {
        word: text.trim(),
        translation: translation.trim(),
        note: note.trim() || null,
        description: description.trim() || null,
        example: example.trim() || null,
        tagIds,
        // Not learned: into the queue (no level, no day); else the level and its day.
        ...(queued ? (word ? { levelId: null } : {}) : { levelId, reviewOn }),
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

      {levels.length > 0 && (
        <div className={s.field}>
          <span className={s.label} id="word-level-label">
            {t.word.level}
          </span>
          {/* Chips, like the tags: picking one reschedules the word below. */}
          <div className={s.chips} role="radiogroup" aria-labelledby="word-level-label">
            <button
              type="button"
              role="radio"
              aria-checked={queued}
              className={clsx(s.chip, queued && s.chipOn)}
              onClick={() => setLevelId('')}
            >
              {queued && <Check size={14} strokeWidth={2.5} aria-hidden />}
              {t.word.unlearned}
            </button>
            {levels.map((l) => {
              const on = levelId === l.id
              const name = levelLabel(l)
              const days = l.locked ? null : t.days(l.intervalDays)
              return (
                <button
                  key={l.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  className={clsx(s.chip, on && s.chipOn)}
                  onClick={() => chooseLevel(l.id)}
                  aria-label={days && days !== name ? `${name}, ${days}` : name}
                >
                  {on && <Check size={14} strokeWidth={2.5} aria-hidden />}
                  {name}
                  {/* A level named after its interval ("3 kun") needs no second label. */}
                  {days && days !== name && <span className={s.chipSub}>· {days}</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}
      {queued ? (
        <span className={s.hint}>{t.word.unlearnedHint(settings?.newPerDay ?? 20)}</span>
      ) : (
        <>
          <div className={s.field}>
            <span className={s.label}>{t.word.memoriseOn}</span>
            <DateField label={t.word.memoriseOn} value={reviewOn} onChange={(d) => d && setReviewOn(d)} />
          </div>
          <span className={s.hint}>{reviewOn ? t.word.joinsHint : t.word.pickDay}</span>
        </>
      )}
      <TagPicker value={tagIds} onChange={setTagIds} />

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
