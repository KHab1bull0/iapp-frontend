import clsx from 'clsx'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/core/contexts/AuthContext'
import { ConfirmDialog } from '@/core/components/ui/ConfirmDialog'
import { useCoreT } from '@/core/i18n/useCoreT'
import s from './SignOutButton.module.scss'

interface Props {
  /** 'block' is the full-width button in Settings; 'compact' fits a side panel. */
  variant?: 'block' | 'compact'
}

/** Signing out always asks first: on a phone it is one stray tap away. */
export function SignOutButton({ variant = 'block' }: Props) {
  const { logout } = useAuth()
  const t = useCoreT()

  return (
    <ConfirmDialog
      trigger={
        <button className={clsx(variant === 'block' ? s.signOut : s.signOutCompact)}>
          <LogOut size={variant === 'block' ? 18 : 15} /> {t.signOut.button}
        </button>
      }
      title={t.signOut.title}
      description={t.signOut.description}
      confirmLabel={t.signOut.button}
      cancelLabel={t.common.cancel}
      icon={LogOut}
      onConfirm={logout}
    />
  )
}
