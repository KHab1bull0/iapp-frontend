import { Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/core/components/ui/ConfirmDialog'
import { useEnglishT } from '@/modules/english/i18n'
import e from './EnglishSettings.module.scss'

/** A delete icon that asks first. */
export function ConfirmDelete({ label, description, onConfirm }: { label: string; description: string; onConfirm: () => void }) {
  const t = useEnglishT()
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
