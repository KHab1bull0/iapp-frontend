import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useCoreT } from '@/core/i18n/useCoreT'
import s from './settings.module.scss'

interface Props {
  title: string
  description: string
  children: ReactNode
}

/** One settings page: a back link to the list on mobile, then title and content. */
export function SettingsSubpage({ title, description, children }: Props) {
  const t = useCoreT()
  return (
    <div className={s.page}>
      <Link to="/settings" className={s.back}>
        <ChevronLeft size={18} /> {t.settings.title}
      </Link>
      <header className={s.pageHead}>
        <div>
          <h1 className={s.h1}>{title}</h1>
          <div className={s.pageSub}>{description}</div>
        </div>
      </header>
      {children}
    </div>
  )
}
