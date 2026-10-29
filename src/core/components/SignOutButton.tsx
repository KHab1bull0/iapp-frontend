import clsx from 'clsx'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/core/contexts/AuthContext'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/core/components/ui/alert-dialog'
import s from './SignOutButton.module.scss'

interface Props {
  /** 'block' is the full-width button in Settings; 'compact' fits a side panel. */
  variant?: 'block' | 'compact'
}

/** Signing out always asks first: on a phone it is one stray tap away. */
export function SignOutButton({ variant = 'block' }: Props) {
  const { logout } = useAuth()

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className={clsx(variant === 'block' ? s.signOut : s.signOutCompact)}>
          <LogOut size={variant === 'block' ? 18 : 15} /> Sign out
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sign out of IAPP?</AlertDialogTitle>
          <AlertDialogDescription>
            You will need your username and password to sign back in.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={logout}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Sign out
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
