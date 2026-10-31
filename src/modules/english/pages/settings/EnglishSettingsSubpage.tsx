import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useEnglishT } from '@/modules/english/i18n'
import st from '@/pages/settings/settings.module.scss'

/** One English settings page: back to the section list on phones, then title and content. */
export function EnglishSettingsSubpage({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  const t = useEnglishT()
  return (
    <div className={st.page}>
      <Link to="/english/settings" className={st.back}>
        <ChevronLeft size={18} /> {t.settings.back}
      </Link>
      <header className={st.pageHead}>
        <div>
          <h1 className={st.h1}>{title}</h1>
          <div className={st.pageSub}>{description}</div>
        </div>
      </header>
      {children}
    </div>
  )
}
