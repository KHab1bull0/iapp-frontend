import { useEffect, useState, type FormEvent } from 'react'
import clsx from 'clsx'
import { useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { createCategory, updateCategory, type Category } from '@/modules/finance/api/categories'
import { toast } from '@/core/components/ui/toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/core/components/ui/dialog'
import { useFinanceT } from '@/modules/finance/i18n'
import s from './AddCategoryDialog.module.scss'

const COLOR_PALETTE = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
  '#6b7280', '#0ea5e9', '#f43f5e', '#84cc16',
]

const EMOJI_LIST = [
  '💰','💵','💳','🏦','📈','📉','🤑','👛',
  '🛒','🏠','🚗','✈️','🍔','🎮','📚','🏥',
  '🎓','👔','🍽️','☕','🎵','🎬','💡','📱',
  '💻','🏋️','🏃','💊','🎁','🔖','🌿','🐾',
]

const TYPE_TABS = ['expense', 'income'] as const

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category
}

export function AddCategoryDialog({ open, onOpenChange, category }: Props) {
  const qc = useQueryClient()
  const isEdit = Boolean(category)

  const t = useFinanceT()
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLOR_PALETTE[5])
  const [icon, setIcon] = useState('📁')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function reset() {
    if (category) {
      setType(category.type); setName(category.name); setColor(category.color); setIcon(category.icon); setError('')
    } else {
      setType('expense'); setName(''); setColor(COLOR_PALETTE[5]); setIcon('📁'); setError('')
    }
  }

  useEffect(() => {
    if (open) reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, category])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError(t.categories.nameRequired); return }

    setLoading(true); setError('')
    try {
      if (category) {
        await updateCategory(category.id, { name: name.trim(), type, color, icon })
      } else {
        await createCategory({ name: name.trim(), type, color, icon })
      }
      await qc.invalidateQueries({ queryKey: ['categories'] })
      await qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast(category ? t.categories.updated : t.categories.created, 'success')
      reset()
      onOpenChange(false)
    } catch {
      setError(category ? t.categories.updateFailed : t.categories.createFailed)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v) }}>
      {/* className="h-screen" used to force this short form to a full 100vh box. */}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? t.categories.editTitle : t.categories.addTitle}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className={s.form}>
          {/* Type */}
          <div className={s.tabs}>
            {TYPE_TABS.map((value) => (
              <button
                key={value} type="button" onClick={() => setType(value)}
                className={clsx(s.tab, type === value && s.active)}
              >
                {t[value]}
              </button>
            ))}
          </div>

          {/* Name */}
          <label className={s.field}>
            <span className={s.fieldLabel}>{t.categories.name}</span>
            <div className={s.inputWrap}>
              <input
                className={s.input}
                placeholder={t.categories.namePlaceholder}
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                required
              />
            </div>
          </label>

          {/* Colour */}
          <div className={s.field}>
            <span className={s.fieldLabel}>{t.categories.color}</span>
            <div className={s.swatchRow}>
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  title={c}
                  aria-label={t.categories.colorLabel(c)}
                  aria-pressed={color === c}
                  onClick={() => setColor(c)}
                  className={clsx(s.swatch, color === c && s.active)}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Icon */}
          <div className={s.field}>
            <span className={s.fieldLabel}>{t.categories.icon}</span>
            <div className={s.emojiGrid}>
              {EMOJI_LIST.map((e) => (
                <button
                  key={e}
                  type="button"
                  title={e}
                  aria-label={t.categories.iconLabel(e)}
                  aria-pressed={icon === e}
                  onClick={() => setIcon(e)}
                  className={clsx(s.emoji, icon === e && s.active)}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {error && <div className={s.formError} role="alert">{error}</div>}

          <div className={s.formActions}>
            <button type="button" className={s.btnSecondary} onClick={() => onOpenChange(false)}>
              {t.cancel}
            </button>
            <button type="submit" className={s.btnPrimary} disabled={loading}>
              {!isEdit && <Plus size={14} />}
              {isEdit ? (loading ? t.saving : t.save) : (loading ? t.categories.creating : t.categories.create)}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
