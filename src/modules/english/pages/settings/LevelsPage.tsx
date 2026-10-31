import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
import { toast } from '@/core/components/ui/toast'
import {
  createLevel,
  deleteLevel,
  englishKeys,
  fetchLevels,
  updateLevel,
  type Level,
} from '@/modules/english/api/english'
import { ConfirmDelete } from './ConfirmDelete'
import { EnglishSettingsSubpage } from './EnglishSettingsSubpage'
import { apiMessage as message } from './errors'
import s from '../EnglishPages.module.scss'
import e from './EnglishSettings.module.scss'

const days = (n: number) => `${n} day${n === 1 ? '' : 's'}`

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

/** English settings → Levels: how long a remembered word stays away at each step. */
export function LevelsPage() {
  const qc = useQueryClient()
  const refresh = () => qc.invalidateQueries({ queryKey: englishKeys.all })
  const { data: levels = [] } = useQuery({ queryKey: englishKeys.levels, queryFn: fetchLevels })
  const [levelName, setLevelName] = useState('')
  const [levelDays, setLevelDays] = useState('')

  const addLevel = useMutation({
    mutationFn: () => createLevel({ name: levelName.trim(), intervalDays: Number(levelDays) }),
    onSuccess: async () => {
      setLevelName('')
      setLevelDays('')
      await refresh()
    },
    onError: (err) => toast(message(err, 'Could not add the level'), 'error'),
  })

  const levelValid = levelName.trim() && Number.isInteger(Number(levelDays)) && Number(levelDays) >= 1

  return (
    <EnglishSettingsSubpage title="Levels" description="Review steps and their days">
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
    </EnglishSettingsSubpage>
  )
}
