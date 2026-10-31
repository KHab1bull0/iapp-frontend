import { Link, Navigate, useOutletContext } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useAuth } from '@/core/contexts/AuthContext'
import { useIsMobile } from '@/core/hooks/useMediaQuery'
import { useProfile } from '@/core/hooks/useProfile'
import { SignOutButton } from '@/core/components/SignOutButton'
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
      <h1 className={s.h1}>{t.settings.title}</h1>

      <Link to="/settings/profile" className={s.profileCard}>
        <div className={s.avatar}>{(displayName || 'U')[0]}</div>
        <div className={s.rowText}>
          <div className={s.profileName}>{displayName}</div>
          <div className={s.rowSub}>@{user?.username}</div>
        </div>
        <ChevronRight size={18} className={s.chevron} />
      </Link>

      {groups.map((g) => (
        <section key={g.title} className={s.hubGroup}>
          <h2 className={s.groupTitle}>{g.title}</h2>
          <div className={s.list}>
            {g.items.map(({ to, label, description, icon: Icon }) => (
              <Link key={to} to={to} className={s.listRow}>
                <span className={s.iconTile}>
                  <Icon size={17} />
                </span>
                <span className={s.rowText}>
                  <span className={s.rowTitle}>{label}</span>
                  <span className={s.rowSub} style={{ display: 'block' }}>
                    {description}
                  </span>
                </span>
                <ChevronRight size={18} className={s.chevron} />
              </Link>
            ))}
          </div>
        </section>
      ))}

      <SignOutButton />

      <div className={s.hubFooter}>{t.settings.footer}</div>
    </div>
  )
}
