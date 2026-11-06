import { Link, Navigate, useOutletContext } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useAuth } from '@/core/contexts/AuthContext'
import { useIsMobile } from '@/core/hooks/useMediaQuery'
import { useProfile } from '@/core/hooks/useProfile'
import { SignOutButton } from '@/core/components/SignOutButton'
import { ListGroup, ListRow } from '@/core/components/ui/List'
import { PageHeader } from '@/core/components/ui/PageHeader'
import { useCoreT } from '@/core/i18n/useCoreT'
import type { SettingsOutletContext } from './SettingsLayout'
import s from './settings.module.scss'

/**
 * /settings. On a phone this is the list of sections; on desktop the list is
 * already on the left, so open the first section instead.
 */
export function SettingsIndex() {
  const isMobile = useIsMobile()
  const { groups } = useOutletContext<SettingsOutletContext>()
  const { user } = useAuth()
  const { displayName } = useProfile()
  const t = useCoreT()

  if (!isMobile) return <Navigate to="/settings/profile" replace />

  return (
    <div className={s.hub}>
      <PageHeader title={t.settings.title} compactBar />

      <Link to="/settings/profile" className={s.profileCard}>
        <div className={s.avatar}>{(displayName || 'U')[0]}</div>
        <div className={s.rowText}>
          <div className={s.profileName}>{displayName}</div>
          <div className={s.rowSub}>@{user?.username}</div>
        </div>
        <ChevronRight size={18} className={s.chevron} />
      </Link>

      {groups.map((g) => (
        <ListGroup key={g.title} title={g.title}>
          {g.items.map(({ to, label, description, icon }) => (
            <ListRow key={to} to={to} title={label} subtitle={description} icon={icon} />
          ))}
        </ListGroup>
      ))}

      <SignOutButton />

      <div className={s.hubFooter}>{t.settings.footer}</div>
    </div>
  )
}
