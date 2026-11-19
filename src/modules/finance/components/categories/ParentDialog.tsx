import { useState, type FormEvent } from 'react'
import clsx from 'clsx'
import { useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import type { Category } from '@/modules/finance/api/categories'
import {
  createCategoryParent,
  updateCategoryParent,
  type CategoryParent,
} from '@/modules/finance/api/categoryParents'
import { toast } from '@/core/components/ui/toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/core/components/ui/dialog'
import { useLang } from '@/core/i18n'
import { apiErrorText } from '@/core/i18n/errors'
import { CATEGORY_SWATCHES } from '@/core/lib/chartColors'
import { useCategoryName, useFinanceT } from '@/modules/finance/i18n'
import { Spinner } from '@/modules/finance/components/loading/Loading'
import { EMOJI_LIST } from './emojis'
import { refreshCategories } from './refresh'
import s from './AddCategoryDialog.module.scss'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: 'income' | 'expense'
  categories: Category[]
  /** Editing this one; creating when left out. */
  parent?: CategoryParent
}

/** A parent: its name, colour and icon, and which categories go in it. */
export function ParentDialog({ open, onOpenChange, type, categories, parent }: Props) {
  const qc = useQueryClient()
  const t = useFinanceT()
  const { lang } = useLang()
  const catName = useCategoryName()
  const kind = parent?.type ?? type

  const initial = () => ({
    name: parent?.name ?? '',
    color: parent?.color ?? CATEGORY_SWATCHES[5],
    icon: parent?.icon ?? '📁',
    ids: categories.filter((c) => parent && c.parentId === parent.id).map((c) => c.id),
  })
  const [form, setForm] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Fresh fields each time it opens, React's pattern for state that follows props.
  const [shown, setShown] = useState({ open, parent })
  if (shown.open !== open || shown.parent !== parent) {
    setShown({ open, parent })
    if (open) {
      setForm(initial())
      setError('')
    }
  }

  // Only unassigned categories of its type, and its own, can go in.
  const choices = categories.filter((c) => c.type === kind && (!c.parentId || c.parentId === parent?.id))
  const toggle = (id: string) =>
    setForm((f) => ({ ...f, ids: f.ids.includes(id) ? f.ids.filter((x) => x !== id) : [...f.ids, id] }))

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (loading) return
    const name = form.name.trim()
    if (!name) return setError(t.categories.nameRequired)
    setLoading(true)
    setError('')
    try {
      const body = { name, color: form.color, icon: form.icon, categoryIds: form.ids }
      if (parent) await updateCategoryParent(parent.id, body)
      else await createCategoryParent({ ...body, type: kind })
      await refreshCategories(qc)
      toast(parent ? t.categories.parentUpdated : t.categories.parentCreated, 'success')
      onOpenChange(false)
    } catch (err) {
      setError(apiErrorText(err, lang, t.categories.parentSaveFailed))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{parent ? t.categories.parentEditTitle : t.categories.parentAddTitle}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className={s.form}>
          <label className={s.field}>
            <span className={s.fieldLabel}>{t.categories.name}</span>
            <div className={s.inputWrap}>
              <input
                className={s.input}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                maxLength={100}
                aria-label={t.categories.name}
              />
            </div>
          </label>

          <div className={s.field}>
            <span className={s.fieldLabel}>{t.categories.parentChildren}</span>
            {choices.length === 0 ? (
              <p className={s.hint}>{t.categories.parentNoChildren}</p>
            ) : (
              <div className={s.checkList}>
                {choices.map((c) => (
                  <label key={c.id} className={clsx(s.check, form.ids.includes(c.id) && s.active)}>
                    <input type="checkbox" checked={form.ids.includes(c.id)} onChange={() => toggle(c.id)} />
                    <span aria-hidden>{c.icon}</span>
                    {catName(c.name)}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className={s.field}>
            <span className={s.fieldLabel}>{t.categories.color}</span>
            <div className={s.swatchRow}>
              {CATEGORY_SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={t.categories.colorLabel(c)}
                  aria-pressed={form.color === c}
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  className={clsx(s.swatch, form.color === c && s.active)}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className={s.field}>
            <span className={s.fieldLabel}>{t.categories.icon}</span>
            <div className={s.emojiGrid}>
              {EMOJI_LIST.map((e) => (
                <button
                  key={e}
                  type="button"
                  aria-label={t.categories.iconLabel(e)}
                  aria-pressed={form.icon === e}
                  onClick={() => setForm((f) => ({ ...f, icon: e }))}
                  className={clsx(s.emoji, form.icon === e && s.active)}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {error && <div className={s.formError} role="alert">{error}</div>}

          <div className={s.formActions} data-form-actions>
            <button type="button" className={s.btnSecondary} onClick={() => onOpenChange(false)}>
              {t.cancel}
            </button>
            <button type="submit" className={s.btnPrimary} disabled={loading} aria-busy={loading || undefined}>
              {loading ? <Spinner size={14} /> : !parent && <Plus size={14} />}
              {parent ? (loading ? t.saving : t.save) : loading ? t.categories.creating : t.categories.create}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
