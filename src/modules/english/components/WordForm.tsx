import { useState, type FormEvent } from 'react'
import clsx from 'clsx'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { todayYmd, ymd } from '@/core/lib/format'
import { toast } from '@/core/components/ui/toast'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/core/components/ui/alert-dialog'
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
import s from './WordForm.module.scss'

interface Props {
  word: Word | null
  onSaved: () => void
  onCancel: () => void
}

interface ApiError {
  response?: { status?: number; data?: { message?: string | string[] } }
}

export function WordForm({ word, onSaved, onCancel }: Props) {
  const qc = useQueryClient()
  const [text, setText] = useState(word?.word ?? '')
  const [translation, setTranslation] = useState(word?.translation ?? '')
  const [note, setNote] = useState(word?.note ?? '')
  const [categoryId, setCategoryId] = useState(word?.categoryId ?? '')
  const [reviewOn, setReviewOn] = useState(word?.reviewOn ?? todayYmd())
  const [levelId, setLevelId] = useState(word?.levelId ?? '')

  // The picker only appears once there is a category to pick.
  const { data: categories = [] } = useQuery({
    queryKey: englishKeys.categories,
    queryFn: fetchCategories,
  })

  // Editing only: a new word always starts at New.
  const { data: levels = [] } = useQuery({
    queryKey: englishKeys.levels,
    queryFn: fetchLevels,
    enabled: Boolean(word),
  })

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

  const valid = text.trim() && translation.trim() && reviewOn

  const save = useMutation({
    mutationFn: () => {
      const input: WordInput = {
        word: text.trim(),
        translation: translation.trim(),
        note: note.trim() || null,
        categoryId: categoryId || null,
        reviewOn,
        ...(word && levelId ? { levelId } : {}),
      }
      return word ? updateWord(word.id, input) : createWord(input)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: englishKeys.all })
      toast(word ? 'Word updated' : 'Word added', 'success')
      onSaved()
    },
    onError: (err) => {
      const e = err as ApiError
      toast(e.response?.status === 409 ? 'That word is already in your vocabulary' : 'Could not save the word', 'error')
    },
  })

  const remove = useMutation({
    mutationFn: () => deleteWord(word!.id),
    onSuccess: async () => {
      qc.removeQueries({ queryKey: englishKeys.word(word!.id) })
      await qc.invalidateQueries({ queryKey: englishKeys.all })
      toast('Word deleted', 'success')
      onSaved()
    },
    onError: () => toast('Could not delete the word', 'error'),
  })

  function submit(e: FormEvent) {
    e.preventDefault()
    if (valid && !save.isPending) save.mutate()
  }

  return (
    <form className={s.form} onSubmit={submit}>
      <div className={s.row}>
        <label className={s.field}>
          <span className={s.label}>Word</span>
          <input
            className={s.input}
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={100}
            placeholder="English"
            aria-label="Word"
            autoFocus={!word}
            autoCapitalize="none"
          />
        </label>
        <label className={s.field}>
          <span className={s.label}>Translation</span>
          <input
            className={s.input}
            value={translation}
            onChange={(e) => setTranslation(e.target.value)}
            maxLength={200}
            placeholder="Tarjimasi"
            aria-label="Translation"
          />
        </label>
      </div>

      <label className={s.field}>
        <span className={s.label}>Meaning / note</span>
        <textarea
          className={clsx(s.input, s.textarea)}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={1000}
          rows={2}
          placeholder="Optional: meaning, an example sentence…"
          aria-label="Note"
        />
      </label>

      {word && levels.length > 0 && (
        <label className={s.field}>
          <span className={s.label}>Level</span>
          <select
            className={s.input}
            value={levelId}
            onChange={(e) => chooseLevel(e.target.value)}
            aria-label="Level"
          >
            {levels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} {l.locked ? '' : `· ${l.intervalDays} day${l.intervalDays === 1 ? '' : 's'}`}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className={s.row}>
        <label className={s.field}>
          <span className={s.label}>Memorise on</span>
          <input
            type="date"
            className={s.input}
            value={reviewOn}
            onChange={(e) => setReviewOn(e.target.value)}
            aria-label="Memorise on"
          />
        </label>
        {categories.length > 0 && (
          <label className={s.field}>
            <span className={s.label}>Category</span>
            <select
              className={s.input}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              aria-label="Category"
            >
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <span className={s.hint}>
        {reviewOn ? 'It joins the review stack on this day.' : 'Pick a day to memorise it.'}
      </span>

      <div className={s.actions}>
        {word && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button type="button" className={s.btnDanger}>
                Delete
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete “{word.word}”?</AlertDialogTitle>
                <AlertDialogDescription>It is removed from your vocabulary.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => remove.mutate()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <button type="button" className={s.btnSecondary} onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className={s.btnPrimary} disabled={!valid || save.isPending}>
          {save.isPending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}
