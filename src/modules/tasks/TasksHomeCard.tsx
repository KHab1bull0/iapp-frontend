import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ListChecks } from 'lucide-react'
import { useToday } from '@/core/hooks/useToday'
import { fetchToday, tasksKeys } from './api/tasks'
import { useTasksT } from './i18n'
import s from './TasksHomeCard.module.scss'

const PREVIEW = 3

/** Home: how much is due today, and the first few things, overdue first. */
export function TasksHomeCard() {
  const m = useTasksT()
  const today = useToday()
  // Same key as the Today page, so the two share one request and stay in step.
  const { data, isError } = useQuery({
    queryKey: tasksKeys.today(today),
    queryFn: () => fetchToday(today),
  })

  const due = data ? [...data.overdue, ...data.today] : []

  return (
    <Link to="/tasks" className={s.card}>
      <div className={s.head}>
        <span className={s.icon}>
          <ListChecks size={16} />
        </span>
        <span className={s.title}>{m.title}</span>
        {data && data.overdue.length > 0 && <span className={s.overdue}>{m.home.overdue(data.overdue.length)}</span>}
      </div>

      {isError ? (
        <div className={s.sub}>{m.home.failed}</div>
      ) : !data ? (
        <span className={s.skeleton} />
      ) : due.length === 0 ? (
        <div className={s.sub}>{m.nothingToday}</div>
      ) : (
        <>
          <div className={s.count}>{m.home.due(due.length)}</div>
          <ul className={s.list}>
            {due.slice(0, PREVIEW).map((t) => (
              <li key={t.id}>{t.title}</li>
            ))}
          </ul>
        </>
      )}
    </Link>
  )
}
