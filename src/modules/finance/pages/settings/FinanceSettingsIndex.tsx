import { Link, Navigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { BackButton } from '@/core/components/BackButton'
import { useIsMobile } from '@/core/hooks/useMediaQuery'
import { useFinanceT } from '@/modules/finance/i18n'
import { settingsSections } from './sections'
import st from '@/pages/settings/settings.module.scss'

/** /finance/settings: the list of sections on a phone; desktop opens the first one. */
export function FinanceSettingsIndex() {
  const isMobile = useIsMobile()
  const t = useFinanceT().settings
  if (!isMobile) return <Navigate to="/finance/settings/categories" replace />

  return (
    <div className={st.hub}>
      <BackButton fallback="/finance" className={st.backLink} />
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
