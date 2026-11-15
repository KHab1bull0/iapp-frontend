import { Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/core/components/ui/ConfirmDialog'
import { useEnglishT } from '@/modules/english/i18n'
import { Spinner } from '@/modules/english/components/Loading'
import e from './EnglishSettings.module.scss'

/** A delete icon that asks first; while the delete runs, a turning ring that can't be pressed again. */
export function ConfirmDelete({
  label,
  description,
  onConfirm,
  pending = false,
}: {
  label: string
  description: string
  onConfirm: () => void
  pending?: boolean
}) {
  const t = useEnglishT()
  if (pending) {
    return (
      <button className={e.iconBtn} disabled aria-busy="true" aria-label={`${t.deleteNamed(label)} — ${t.deleting}`}>
        <Spinner size={14} />
      </button>
    )
  }
  return (
    <ConfirmDialog
      trigger={
        <button className={e.iconBtn} aria-label={t.deleteNamed(label)}>
          <Trash2 size={14} />
        </button>
      }
      title={t.deleteTitle(label)}
      description={description}
      confirmLabel={t.delete}
      cancelLabel={t.cancel}
      onConfirm={onConfirm}
    />
  )
}
