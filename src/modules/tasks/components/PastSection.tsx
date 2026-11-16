import { useState, type ReactNode } from 'react'
import clsx from 'clsx'
import { ChevronDown } from 'lucide-react'
import { useTasksT } from '@/modules/tasks/i18n'
import s from '../pages/TasksPages.module.scss'

/**
 * Tasks whose day has passed, at the very end of a list and folded away by
 * default: there when looked for, no red overdue pile. Renders nothing when
 * there are none.
 */
export function PastSection({ count, children }: { count: number; children: ReactNode }) {
  const t = useTasksT()
  const [open, setOpen] = useState(false)
  if (count === 0) return null
  return (
    <section className={s.section}>
      <button type="button" className={s.foldHead} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span className={s.sectionHead}>
          <h2 className={s.sectionTitle}>{t.groups.past}</h2>
          <span className={s.count}>{count}</span>
        </span>
        <ChevronDown size={18} className={clsx(s.foldIcon, open && s.open)} aria-hidden />
      </button>
      {open && <div className={s.list}>{children}</div>}
    </section>
  )
}
