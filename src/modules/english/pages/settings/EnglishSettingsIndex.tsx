import { Link, Navigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useIsMobile } from '@/core/hooks/useMediaQuery'
import { useEnglishT } from '@/modules/english/i18n'
import { settingsSections } from './sections'
import st from '@/pages/settings/settings.module.scss'

/** /english/settings: the list of sections on a phone; desktop opens the first one. */
export function EnglishSettingsIndex() {
  const isMobile = useIsMobile()
  const t = useEnglishT().settings
  if (!isMobile) return <Navigate to="/english/settings/levels" replace />

  return (
    <div className={st.hub}>
      <Link to="/settings" className={st.backLink}>
        <ChevronLeft size={18} /> {t.appSettings}
      </Link>
      <h1 className={st.h1}>{t.title}</h1>
      <div className={st.list}>
        {settingsSections(t).map(({ to, label, description, icon: Icon }) => (
          <Link key={to} to={to} className={st.listRow}>
            <span className={st.iconTile}>
              <Icon size={17} />
            </span>
            <span className={st.rowText}>
              <span className={st.rowTitle}>{label}</span>
              <span className={st.rowSub} style={{ display: 'block' }}>
                {description}
              </span>
            </span>
            <ChevronRight size={18} className={st.chevron} />
          </Link>
        ))}
      </div>
    </div>
  )
}
