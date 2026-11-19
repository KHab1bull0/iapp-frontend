import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ListChecks, Plus } from 'lucide-react'
import { HomeCard } from '@/core/components/HomeCard'
import { EmptyState } from '@/core/components/ui/EmptyState'
import { ProgressRing } from '@/core/components/ui/Progress'
import { Skeleton } from '@/core/components/ui/Skeleton'
import { useToday } from '@/core/hooks/useToday'
import { useQuickAdd } from '@/core/quickAdd/context'
import { fetchToday, tasksKeys } from './api/tasks'
import { TaskRow } from './components/TaskRow'
import { LoadingLabel, RowsSkeleton } from './components/skeletons'
import { byTime } from './lib/repeat'
import { useCompleteTask } from './useCompleteTask'
import { useTaskEditor } from './useTaskEditor'
import { useTasksT } from './i18n'
import s from './TasksHomeCard.module.scss'

const PREVIEW = 5

/** Home: today's tasks, ticked off right here, with how far through the day you are. */
export function TasksHomeCard() {
  const m = useTasksT()
  const today = useToday()
  const quickAdd = useQuickAdd()
  const editor = useTaskEditor()
  const { complete, pending } = useCompleteTask(today)
  // Same key as the Today page, so the two share one request and stay in step.
  const { data, isError } = useQuery({
    queryKey: tasksKeys.today(today),
    queryFn: () => fetchToday(today),
  })

  const due = data ? byTime(data.today) : []
  const done = data?.doneToday.length ?? 0
  const all = due.length + done

  return (
    <HomeCard
      icon={ListChecks}
      title={m.title}
      to="/tasks"
      linkLabel={m.home.open}
      accessory={
        // The ring's place is held while the day loads.
        !data && !isError ? (
          <Skeleton width={44} height={44} radius="var(--radius-pill)" />
        ) : (
          all > 0 && (
            <ProgressRing value={done} max={all} label={m.home.progress(done, all)} size={44} stroke={5}>
              <span className={s.ringText}>
                {done}/{all}
              </span>
            </ProgressRing>
          )
        )
      }
    >
      {isError ? (
        <div className={s.sub}>{m.home.failed}</div>
      ) : !data ? (
        // Today's first rows in outline, as the TaskRows will sit.
        <div className={s.list} aria-busy="true">
          <LoadingLabel />
          <RowsSkeleton count={3} />
        </div>
      ) : due.length === 0 ? (
        <EmptyState
          compact
          title={done > 0 ? m.home.allDone : m.nothingToday}
          description={done > 0 ? m.home.allDoneSub : undefined}
          action={{ label: m.home.addTask, icon: Plus, onClick: () => quickAdd.open('tasks.task') }}
        />
      ) : (
        <>
          <div className={s.list}>
            {due.slice(0, PREVIEW).map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                today={today}
                busy={pending.has(t.id)}
                onToggle={complete}
                onOpen={editor.openDetail}
              />
            ))}
          </div>
          {due.length > PREVIEW && (
            <Link to="/tasks" className={s.more}>
              {m.home.more(due.length - PREVIEW)}
            </Link>
          )}
        </>
      )}
      {editor.dialog}
    </HomeCard>
  )
}
