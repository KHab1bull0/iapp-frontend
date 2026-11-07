import type { ReactNode } from 'react'
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'
import clsx from 'clsx'
import { Trash2, type LucideIcon } from 'lucide-react'
import { useCoreT } from '@/core/i18n/useCoreT'
import s from './ConfirmDialog.module.scss'

interface Props {
  /** The button that opens it (rendered as-is: asChild). Leave out when `open` is controlled. */
  trigger?: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title: string
  description?: ReactNode
  /** The confirming button's label: the verb itself ("Delete", "Sign out"), never "OK". */
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void
  /** 'danger' paints the confirm button red: deleting, signing out. */
  tone?: 'danger' | 'default'
  icon?: LucideIcon
}

/**
 * "Are you sure?" before something that can't be taken back, after the way
 * iOS, Things and Linear ask: a calm card with the icon of what is about to
 * happen, a short title naming the thing, one line of consequence, and two
 * buttons of one size — the safe one and the verb. On a phone the card rises
 * from the bottom (in thumb reach) and the buttons stack, the verb on top; on
 * desktop it sits centred and they share a row, the verb on the right.
 * Esc or Cancel backs out; tapping outside does nothing, as with any alert.
 */
export function ConfirmDialog({
  trigger, open, onOpenChange, title, description, confirmLabel, cancelLabel,
  onConfirm, tone = 'danger', icon: Icon = Trash2,
}: Props) {
  const t = useCoreT()
  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <AlertDialogPrimitive.Trigger asChild>{trigger}</AlertDialogPrimitive.Trigger>}
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className={s.overlay} />
        <AlertDialogPrimitive.Content
          className={s.card}
          // No focus ring flashing on a phone before the user has touched
          // anything (as the app's other dialogs do).
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          {...(!description && { 'aria-describedby': undefined })}
        >
          <span className={clsx(s.icon, tone === 'danger' && s.iconDanger)} aria-hidden>
            <Icon size={22} strokeWidth={2} />
          </span>
          <AlertDialogPrimitive.Title className={s.title}>{title}</AlertDialogPrimitive.Title>
          {description && (
            <AlertDialogPrimitive.Description className={s.description}>{description}</AlertDialogPrimitive.Description>
          )}
          <div className={s.actions}>
            <AlertDialogPrimitive.Action
              className={clsx(s.confirm, tone === 'danger' && s.confirmDanger)}
              onClick={onConfirm}
            >
              {confirmLabel}
            </AlertDialogPrimitive.Action>
            <AlertDialogPrimitive.Cancel className={s.cancel}>{cancelLabel ?? t.common.cancel}</AlertDialogPrimitive.Cancel>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  )
}
