import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
import { toast } from '@/core/components/ui/toast'
import { useLang } from '@/core/i18n'
import { apiErrorText } from '@/core/i18n/errors'
import { useToday } from '@/core/hooks/useToday'
import {
  createGroup,
  createTag,
  deleteGroup,
  deleteTag,
  englishKeys,
  fetchGroups,
  fetchTags,
  updateGroup,
  updateTag,
  type Tag,
  type TagGroup,
} from '@/modules/english/api/english'
import { useEnglishT, useGroupName } from '@/modules/english/i18n'
import { shelve } from '@/modules/english/lib/tags'
import { ConfirmDelete } from './ConfirmDelete'
import { EnglishSettingsSubpage } from './EnglishSettingsSubpage'
import s from '../EnglishPages.module.scss'
import e from './EnglishSettings.module.scss'

const useRefresh = () => {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: englishKeys.all })
}

function TagRow({ tag, groups }: { tag: Tag; groups: TagGroup[] }) {
  const { lang } = useLang()
  const t = useEnglishT()
  const groupName = useGroupName()
  const refresh = useRefresh()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(tag.name)
  const [groupId, setGroupId] = useState(tag.groupId ?? '')

  const save = useMutation({
    mutationFn: () => updateTag(tag.id, { name: name.trim(), groupId: groupId || null }),
    onSuccess: async () => {
      setEditing(false)
      await refresh()
    },
    onError: (err) => toast(apiErrorText(err, lang, t.settings.tagSaveFailed), 'error'),
  })
  const remove = useMutation({
    mutationFn: () => deleteTag(tag.id),
    onSuccess: refresh,
    onError: (err) => toast(apiErrorText(err, lang, t.settings.tagDeleteFailed), 'error'),
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
        <input
          className={e.input}
          value={name}
          onChange={(ev) => setName(ev.target.value)}
          maxLength={50}
          aria-label={t.settings.nameOf(tag.name)}
        />
        <select
          className={e.select}
          value={groupId}
          onChange={(ev) => setGroupId(ev.target.value)}
          aria-label={t.settings.tagGroup}
        >
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {groupName(g)}
            </option>
          ))}
          <option value="">{t.settings.ungrouped}</option>
        </select>
        <button type="submit" className={e.btnPrimary} disabled={save.isPending}>
          {t.save}
        </button>
        <button
          type="button"
          className={e.btnGhost}
          onClick={() => {
            setName(tag.name)
            setGroupId(tag.groupId ?? '')
            setEditing(false)
          }}
        >
          {t.cancel}
        </button>
      </form>
    )
  }

  return (
    <div className={e.row}>
      <span className={e.name}>{tag.name}</span>
      <span className={e.sub}>{t.settings.words(tag.count)}</span>
      <button className={e.iconBtn} onClick={() => setEditing(true)} aria-label={t.edit(tag.name)}>
        <Pencil size={14} />
      </button>
      <ConfirmDelete label={tag.name} description={t.settings.tagDeleteDesc} onConfirm={() => remove.mutate()} />
    </div>
  )
}

/** A group's head: its name, renamed in place, and deleting it (its tags stay, ungrouped). */
function GroupHead({ group }: { group: TagGroup }) {
  const { lang } = useLang()
  const t = useEnglishT()
  const groupName = useGroupName()
  const refresh = useRefresh()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(groupName(group))

  const save = useMutation({
    mutationFn: () => updateGroup(group.id, { name: name.trim() }),
    onSuccess: async () => {
      setEditing(false)
      await refresh()
    },
    onError: (err) => toast(apiErrorText(err, lang, t.settings.groupSaveFailed), 'error'),
  })
  const remove = useMutation({
    mutationFn: () => deleteGroup(group.id),
    onSuccess: refresh,
    onError: (err) => toast(apiErrorText(err, lang, t.settings.groupDeleteFailed), 'error'),
  })

  if (editing) {
    return (
      <form
        className={e.groupHead}
        onSubmit={(ev) => {
          ev.preventDefault()
          if (name.trim()) save.mutate()
        }}
      >
        <input
          className={e.input}
          value={name}
          onChange={(ev) => setName(ev.target.value)}
          maxLength={50}
          aria-label={t.settings.nameOf(groupName(group))}
        />
        <button type="submit" className={e.btnPrimary} disabled={save.isPending}>
          {t.save}
        </button>
        <button type="button" className={e.btnGhost} onClick={() => setEditing(false)}>
          {t.cancel}
        </button>
      </form>
    )
  }

  return (
    <div className={e.groupHead}>
      <h2 className={s.sectionTitle}>{groupName(group)}</h2>
      <button className={e.iconBtn} onClick={() => setEditing(true)} aria-label={t.edit(groupName(group))}>
        <Pencil size={14} />
      </button>
      <ConfirmDelete label={groupName(group)} description={t.settings.groupDeleteDesc} onConfirm={() => remove.mutate()} />
    </div>
  )
}

/** Adds a tag straight into one group (or none). */
function AddTagRow({ groupId }: { groupId: string | null }) {
  const { lang } = useLang()
  const t = useEnglishT()
  const refresh = useRefresh()
  const [name, setName] = useState('')
  const add = useMutation({
    mutationFn: () => createTag({ name: name.trim(), groupId }),
    onSuccess: async () => {
      setName('')
      await refresh()
    },
    onError: (err) => toast(apiErrorText(err, lang, t.settings.tagAddFailed), 'error'),
  })
  return (
    <form
      className={e.addRow}
      onSubmit={(ev: FormEvent) => {
        ev.preventDefault()
        if (name.trim()) add.mutate()
      }}
    >
      <input
        className={e.input}
        placeholder={t.settings.newTag}
        value={name}
        onChange={(ev) => setName(ev.target.value)}
        maxLength={50}
        aria-label={t.settings.tagName}
      />
      <button type="submit" className={e.btnPrimary} disabled={!name.trim() || add.isPending}>
        {t.settings.addTag}
      </button>
    </form>
  )
}

/** English settings → Tags: groups (Topics, Parts of speech, …) and the tags in each. */
export function TagsPage() {
  const { lang } = useLang()
  const t = useEnglishT()
  const today = useToday()
  const refresh = useRefresh()
  const nameOfGroup = useGroupName()
  const { data: tags = [] } = useQuery({ queryKey: englishKeys.tags(today), queryFn: () => fetchTags(today) })
  const { data: groups = [] } = useQuery({ queryKey: englishKeys.groups, queryFn: fetchGroups })
  const [groupName, setGroupName] = useState('')

  const addGroup = useMutation({
    mutationFn: () => createGroup({ name: groupName.trim() }),
    onSuccess: async () => {
      setGroupName('')
      await refresh()
    },
    onError: (err) => toast(apiErrorText(err, lang, t.settings.groupAddFailed), 'error'),
  })

  return (
    <EnglishSettingsSubpage title={t.settings.tags} description={t.settings.tagsDesc}>
      <p className={e.help}>{t.settings.tagsHelp}</p>
      {shelve(tags, groups, true).map((shelf) => (
        <section
          key={shelf.group?.id ?? 'none'}
          className={s.section}
          aria-label={nameOfGroup(shelf.group)}
        >
          {shelf.group ? (
            <GroupHead group={shelf.group} />
          ) : (
            <div className={s.sectionHead}>
              <h2 className={s.sectionTitle}>{t.settings.ungrouped}</h2>
            </div>
          )}
          <div className={s.list}>
            {shelf.tags.length === 0 && <div className={e.row}><span className={e.sub}>{t.settings.emptyGroup}</span></div>}
            {shelf.tags.map((tag) => (
              <TagRow key={tag.id} tag={tag} groups={groups} />
            ))}
            <AddTagRow groupId={shelf.group?.id ?? null} />
          </div>
        </section>
      ))}

      <section className={s.section} aria-label={t.settings.groups}>
        <div className={s.list}>
          <form
            className={e.addRow}
            onSubmit={(ev: FormEvent) => {
              ev.preventDefault()
              if (groupName.trim()) addGroup.mutate()
            }}
          >
            <input
              className={e.input}
              placeholder={t.settings.newGroup}
              value={groupName}
              onChange={(ev) => setGroupName(ev.target.value)}
              maxLength={50}
              aria-label={t.settings.groupName}
            />
            <button type="submit" className={e.btnGhost} disabled={!groupName.trim() || addGroup.isPending}>
              {t.settings.addGroup}
            </button>
          </form>
        </div>
      </section>
    </EnglishSettingsSubpage>
  )
}
