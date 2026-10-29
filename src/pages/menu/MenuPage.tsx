import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { MODULES } from '@/modules/registry'
import s from './MenuPage.module.scss'

/** Every module, for when the bottom nav has more modules than slots. */
export function MenuPage() {
  return (
    <div className={s.page}>
      <h1 className={s.h1}>Modules</h1>
      <ul className={s.list}>
        {MODULES.map(({ id, name, icon: Icon, basePath }) => (
          <li key={id}>
            <Link to={basePath} className={s.row}>
              <Icon size={18} />
              <span className={s.name}>{name}</span>
              <ChevronRight size={16} className={s.chevron} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
