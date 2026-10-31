import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
import { toast } from '@/core/components/ui/toast'
import { useLang } from '@/core/i18n'
import { apiErrorText } from '@/core/i18n/errors'
import {
  createLevel,
  deleteLevel,
  englishKeys,
  fetchLevels,
  updateLevel,
  type Level,
} from '@/modules/english/api/english'
import { useEnglishT, useLevelName } from '@/modules/english/i18n'
import { ConfirmDelete } from './ConfirmDelete'
import { EnglishSettingsSubpage } from './EnglishSettingsSubpage'
import s from '../EnglishPages.module.scss'
import e from './EnglishSettings.module.scss'

function LevelRow({ level }: { level: Level }) {
  const qc = useQueryClient()
  const { lang } = useLang()
  const t = useEnglishT()
  const label = useLevelName()(level)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(label)
  const [interval, setInterval] = useState(String(level.intervalDays))
  const refresh = () => qc.invalidateQueries({ queryKey: englishKeys.all })

  // Cancel drops what was typed, so reopening shows the saved values.
  const cancel = () => {
    setName(label)
    setInterval(String(level.intervalDays))
    setEditing(false)
  }

  // An untouched name keeps what is stored, so the seeded "New" stays translatable.
  const savedName = () => (name.trim() === label ? level.name : name.trim())
  const save = useMutation({
    mutationFn: () =>
      updateLevel(level.id, level.locked ? { name: savedName() } : { name: savedName(), intervalDays: Number(interval) }),
    onSuccess: async () => {
      setEditing(false)
      await refresh()
    },
    onError: (err) => toast(apiErrorText(err, lang, t.settings.levelSaveFailed), 'error'),
  })
  const remove = useMutation({
    mutationFn: () => deleteLevel(level.id),
    onSuccess: refresh,
    onError: (err) => toast(apiErrorText(err, lang, t.settings.levelDeleteFailed), 'error'),
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
        <input className={e.input} value={name} onChange={(ev) => setName(ev.target.value)} maxLength={50} aria-label={t.settings.nameOf(label)} />
        {!level.locked && (
          <input
            className={e.daysInput}
            type="number"
            min={1}
            value={interval}
            onChange={(ev) => setInterval(ev.target.value)}
            aria-label={t.settings.daysOf(label)}
          />
        )}
        <button type="submit" className={e.btnPrimary} disabled={save.isPending}>{t.save}</button>
        <button type="button" className={e.btnGhost} onClick={cancel}>{t.cancel}</button>
      </form>
    )
  }

  return (
    <div className={e.row}>
      <span className={e.name}>{label}</span>
      <span className={e.sub}>{level.locked ? t.settings.start : t.days(level.intervalDays)}</span>
      <button className={e.iconBtn} onClick={() => setEditing(true)} aria-label={t.edit(label)}>
        <Pencil size={14} />
      </button>
      {!level.locked && (
        <ConfirmDelete
          label={label}
          description={t.settings.levelDeleteDesc}
          onConfirm={() => remove.mutate()}
        />
      )}
    </div>
  )
}

/** English settings → Levels: how long a remembered word stays away at each step. */
export function LevelsPage() {
  const qc = useQueryClient()
  const { lang } = useLang()
  const t = useEnglishT()
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
    onError: (err) => toast(apiErrorText(err, lang, t.settings.levelAddFailed), 'error'),
  })

  const levelValid = levelName.trim() && Number.isInteger(Number(levelDays)) && Number(levelDays) >= 1

  return (
    <EnglishSettingsSubpage title={t.settings.levels} description={t.settings.levelsDesc}>
      <section className={s.section} aria-label={t.settings.levels}>
        <div className={s.sectionHead}>
          <h2 className={s.sectionTitle}>{t.settings.levels}</h2>
        </div>
        <p className={e.help}>{t.settings.levelsHelp}</p>
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
            <input className={e.input} placeholder={t.settings.newLevel} value={levelName} onChange={(ev) => setLevelName(ev.target.value)} maxLength={50} aria-label={t.settings.levelName} />
            <input className={e.daysInput} type="number" min={1} placeholder={t.settings.daysField} value={levelDays} onChange={(ev) => setLevelDays(ev.target.value)} aria-label={t.settings.daysField} />
            <button type="submit" className={e.btnPrimary} disabled={!levelValid || addLevel.isPending}>
              {t.settings.addLevel}
            </button>
          </form>
        </div>
      </section>
    </EnglishSettingsSubpage>
  )
}
