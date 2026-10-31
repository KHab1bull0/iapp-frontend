import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Pencil, Trash2 } from 'lucide-react'
import { toast } from '@/core/components/ui/toast'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/core/components/ui/alert-dialog'
import {
  createCategory,
  createLevel,
  deleteCategory,
  deleteLevel,
  englishKeys,
  fetchCategories,
  fetchLevels,
  updateCategory,
  updateLevel,
  type Category,
  type Level,
} from '@/modules/english/api/english'
import s from '../EnglishPages.module.scss'
import e from './EnglishSettingsPage.module.scss'

interface ApiError {
  response?: { data?: { message?: string | string[] } }
}
const message = (err: unknown, fallback: string) => {
  const m = (err as ApiError)?.response?.data?.message
  return (Array.isArray(m) ? m[0] : m) ?? fallback
}

const days = (n: number) => `${n} day${n === 1 ? '' : 's'}`
const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

function ConfirmDelete({ label, description, onConfirm }: { label: string; description: string; onConfirm: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className={e.iconBtn} aria-label={`Delete ${label}`}>
          <Trash2 size={14} />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{label}”?</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function LevelRow({ level }: { level: Level }) {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(level.name)
  const [interval, setInterval] = useState(String(level.intervalDays))
  const refresh = () => qc.invalidateQueries({ queryKey: englishKeys.all })

  // Cancel drops what was typed, so reopening shows the saved values.
  const cancel = () => {
    setName(level.name)
    setInterval(String(level.intervalDays))
    setEditing(false)
  }

  const save = useMutation({
    mutationFn: () =>
      updateLevel(level.id, level.locked ? { name: name.trim() } : { name: name.trim(), intervalDays: Number(interval) }),
    onSuccess: async () => {
      setEditing(false)
      await refresh()
    },
    onError: (err) => toast(message(err, 'Could not save the level'), 'error'),
  })
  const remove = useMutation({
    mutationFn: () => deleteLevel(level.id),
    onSuccess: refresh,
    onError: (err) => toast(message(err, 'Could not delete the level'), 'error'),
  })

  if (editing) {
    return (
      <form
        className={e.row}
        onSubmit={(ev) => {
          ev.preventDefault()
          if (name.trim()) save.mutate()
        }}
      >
        <input className={e.input} value={name} onChange={(ev) => setName(ev.target.value)} maxLength={50} aria-label={`Name of ${level.name}`} />
        {!level.locked && (
          <input
            className={e.daysInput}
            type="number"
            min={1}
            value={interval}
            onChange={(ev) => setInterval(ev.target.value)}
            aria-label={`Days of ${level.name}`}
          />
        )}
        <button type="submit" className={e.btnPrimary} disabled={save.isPending}>Save</button>
        <button type="button" className={e.btnGhost} onClick={cancel}>Cancel</button>
      </form>
    )
  }

  return (
    <div className={e.row}>
      <span className={e.name}>{level.name}</span>
      <span className={e.sub}>{level.locked ? 'Start · due at once' : days(level.intervalDays)}</span>
      <button className={e.iconBtn} onClick={() => setEditing(true)} aria-label={`Edit ${level.name}`}>
        <Pencil size={14} />
      </button>
      {!level.locked && (
        <ConfirmDelete
          label={level.name}
          description="Its words go back to the starting level."
          onConfirm={() => remove.mutate()}
        />
      )}
    </div>
  )
}

function CategoryRow({ category }: { category: Category }) {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(category.name)
  const refresh = () => qc.invalidateQueries({ queryKey: englishKeys.all })

  const save = useMutation({
    mutationFn: () => updateCategory(category.id, { name: name.trim() }),
    onSuccess: async () => {
      setEditing(false)
      await refresh()
    },
    onError: (err) => toast(message(err, 'Could not save the category'), 'error'),
  })
  const remove = useMutation({
    mutationFn: () => deleteCategory(category.id),
    onSuccess: refresh,
    onError: () => toast('Could not delete the category', 'error'),
  })

  if (editing) {
    return (
      <form
        className={e.row}
        onSubmit={(ev) => {
          ev.preventDefault()
          if (name.trim()) save.mutate()
        }}
      >
        <input className={e.input} value={name} onChange={(ev) => setName(ev.target.value)} maxLength={50} aria-label={`Name of ${category.name}`} />
        <button type="submit" className={e.btnPrimary} disabled={save.isPending}>Save</button>
        <button
          type="button"
          className={e.btnGhost}
          onClick={() => {
            setName(category.name)
            setEditing(false)
          }}
        >
          Cancel
        </button>
      </form>
    )
  }

  return (
    <div className={e.row}>
      <span className={e.name}>{category.name}</span>
      <span className={e.sub}>Added {dateFmt.format(new Date(category.createdAt))}</span>
      <button className={e.iconBtn} onClick={() => setEditing(true)} aria-label={`Edit ${category.name}`}>
        <Pencil size={14} />
      </button>
      <ConfirmDelete
        label={category.name}
        description="Its words stay, without a category."
        onConfirm={() => remove.mutate()}
      />
    </div>
  )
}

/** English settings (from Settings → Modules): review levels and word categories. */
export function EnglishSettingsPage() {
  const qc = useQueryClient()
  const refresh = () => qc.invalidateQueries({ queryKey: englishKeys.all })

  const { data: levels = [] } = useQuery({ queryKey: englishKeys.levels, queryFn: fetchLevels })
  const { data: categories = [] } = useQuery({ queryKey: englishKeys.categories, queryFn: fetchCategories })

  const [levelName, setLevelName] = useState('')
  const [levelDays, setLevelDays] = useState('')
  const [categoryName, setCategoryName] = useState('')

  const addLevel = useMutation({
    mutationFn: () => createLevel({ name: levelName.trim(), intervalDays: Number(levelDays) }),
    onSuccess: async () => {
      setLevelName('')
      setLevelDays('')
      await refresh()
    },
    onError: (err) => toast(message(err, 'Could not add the level'), 'error'),
  })
  const addCategory = useMutation({
    mutationFn: () => createCategory({ name: categoryName.trim() }),
    onSuccess: async () => {
      setCategoryName('')
      await refresh()
    },
    onError: (err) => toast(message(err, 'Could not add the category'), 'error'),
  })

  const levelValid = levelName.trim() && Number.isInteger(Number(levelDays)) && Number(levelDays) >= 1

  return (
    <div className={s.page}>
      <Link to="/settings" className={e.back}>
        <ChevronLeft size={18} /> Settings
      </Link>
      <header>
        <h1 className={e.h1}>English settings</h1>
        <div className={e.pageSub}>Review levels and word categories</div>
      </header>

      <section className={s.section} aria-label="Levels">
        <div className={s.sectionHead}>
          <h2 className={s.sectionTitle}>Levels</h2>
        </div>
        <p className={e.help}>
          A remembered word moves up one level and comes back after that level's days. A forgotten
          one goes back to the start.
        </p>
        <div className={s.list}>
          {levels.map((l) => (
            <LevelRow key={l.id} level={l} />
          ))}
          <form
            className={e.addRow}
            onSubmit={(ev: FormEvent) => {
              ev.preventDefault()
              if (levelValid) addLevel.mutate()
            }}
          >
            <input className={e.input} placeholder="New level" value={levelName} onChange={(ev) => setLevelName(ev.target.value)} maxLength={50} aria-label="Level name" />
            <input className={e.daysInput} type="number" min={1} placeholder="Days" value={levelDays} onChange={(ev) => setLevelDays(ev.target.value)} aria-label="Days" />
            <button type="submit" className={e.btnPrimary} disabled={!levelValid || addLevel.isPending}>
              Add level
            </button>
          </form>
        </div>
      </section>

      <section className={s.section} aria-label="Categories">
        <div className={s.sectionHead}>
          <h2 className={s.sectionTitle}>Categories</h2>
        </div>
        <div className={s.list}>
          {categories.map((c) => (
            <CategoryRow key={c.id} category={c} />
          ))}
          <form
            className={e.addRow}
            onSubmit={(ev: FormEvent) => {
              ev.preventDefault()
              if (categoryName.trim()) addCategory.mutate()
            }}
          >
            <input className={e.input} placeholder="New category" value={categoryName} onChange={(ev) => setCategoryName(ev.target.value)} maxLength={50} aria-label="Category name" />
            <button type="submit" className={e.btnPrimary} disabled={!categoryName.trim() || addCategory.isPending}>
              Add category
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
