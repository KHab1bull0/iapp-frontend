import type { ReactNode } from 'react'
import { BackButton } from '@/core/components/BackButton'
import st from '@/pages/settings/settings.module.scss'

/** One English settings page: back (to wherever it was opened from) on phones, then title and content. */
export function EnglishSettingsSubpage({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className={st.page}>
      <BackButton fallback="/english/settings" className={st.back} />
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
