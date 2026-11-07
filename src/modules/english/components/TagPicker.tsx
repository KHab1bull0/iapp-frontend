import { useState, type KeyboardEvent } from 'react'
import clsx from 'clsx'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Plus } from 'lucide-react'
import { toast } from '@/core/components/ui/toast'
import { useToday } from '@/core/hooks/useToday'
import { createTag, englishKeys, fetchGroups, fetchTags } from '@/modules/english/api/english'
import { useEnglishT, useGroupName } from '@/modules/english/i18n'
import { shelve } from '@/modules/english/lib/tags'
import s from './WordForm.module.scss'

interface Props {
  value: string[]
  onChange: (tagIds: string[]) => void
}

/**
 * A word's tags: every tag as a chip, shelved by group (Topics, Parts of
 * speech, …), any number on. A new tag can be made right here; it lands
 * ungrouped and is turned on.
 */
export function TagPicker({ value, onChange }: Props) {
  const t = useEnglishT()
  const groupName = useGroupName()
  const today = useToday()
  const qc = useQueryClient()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')

  const { data: tags = [] } = useQuery({ queryKey: englishKeys.tags(today), queryFn: () => fetchTags(today) })
  const { data: groups = [] } = useQuery({ queryKey: englishKeys.groups, queryFn: fetchGroups })
  const shelves = shelve(tags, groups)

  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id])

  const add = useMutation({
    mutationFn: () => createTag({ name: name.trim() }),
    onSuccess: async (tag) => {
      await qc.invalidateQueries({ queryKey: ['english', 'tags'] })
      onChange([...value, tag.id])
      setName('')
      setAdding(false)
    },
    onError: () => toast(t.word.tagAddFailed, 'error'),
  })

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    // Enter makes the tag; it must not submit the word's form.
    if (e.key === 'Enter') {
      e.preventDefault()
      if (name.trim() && !add.isPending) add.mutate()
    } else if (e.key === 'Escape') {
      e.stopPropagation()
      setAdding(false)
      setName('')
    }
  }

  return (
    <div className={s.field}>
      <span className={s.label} id="word-tags-label">
        {t.word.tags}
      </span>
      <div className={s.shelves} role="group" aria-labelledby="word-tags-label">
        {shelves.map((shelf) => (
          <div key={shelf.group?.id ?? 'none'} className={s.shelf}>
            {shelves.length > 1 && <span className={s.shelfName}>{groupName(shelf.group)}</span>}
            <div className={s.chips}>
              {shelf.tags.map((tag) => {
                const on = value.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    type="button"
                    aria-pressed={on}
                    className={clsx(s.chip, on && s.chipOn)}
                    onClick={() => toggle(tag.id)}
                  >
                    {on && <Check size={14} strokeWidth={2.5} aria-hidden />}
                    {tag.name}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
        <div className={s.chips}>
          {adding ? (
            <input
              className={s.chipInput}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={onKey}
              onBlur={() => !name.trim() && setAdding(false)}
              maxLength={50}
              placeholder={t.word.newTag}
              aria-label={t.word.newTag}
              autoFocus
              autoCapitalize="none"
              disabled={add.isPending}
            />
          ) : (
            <button type="button" className={clsx(s.chip, s.chipAdd)} onClick={() => setAdding(true)}>
              <Plus size={14} aria-hidden /> {t.word.addTag}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
