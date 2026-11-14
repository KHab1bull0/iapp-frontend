import clsx from 'clsx'
import { Flame, Plus } from 'lucide-react'
import { EmptyState } from '@/core/components/ui/EmptyState'
import { ProgressBar, ProgressRing } from '@/core/components/ui/Progress'
import { formatSigned } from '@/core/lib/format'
import { useQuickAdd } from '@/core/quickAdd/context'
import type { WeekReview } from '@/modules/tasks/api/reviews'
import { useReviewT } from './i18n'
import s from './Review.module.scss'

function Figures({ items, className }: { items: { label: string; value: string; tone?: 'success' | 'danger' }[]; className?: string }) {
  return (
    <dl className={clsx(s.figures, className)}>
      {items.map(({ label, value, tone }) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd className={tone && s[tone]}>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function TasksCard({ tasks }: { tasks: WeekReview['tasks'] }) {
  const t = useReviewT().tasks
  const quickAdd = useQuickAdd()
  return (
    <section className={s.card} aria-label={t.title}>
      <h2 className={s.cardTitle}>{t.title}</h2>
      {tasks.due === 0 ? (
        <EmptyState
          compact
          title={t.none}
          description={t.noneSub}
          action={{ label: t.add, icon: Plus, onClick: () => quickAdd.open('tasks.task') }}
        />
      ) : (
        <>
          <div className={s.tasksTop}>
            <ProgressRing
              value={tasks.rate}
              max={100}
              label={t.rateLabel(tasks.rate)}
              size={72}
              stroke={7}
              tone={tasks.rate >= 80 ? 'success' : 'primary'}
            >
              <span className={s.ringValue}>{tasks.rate}%</span>
            </ProgressRing>
            <div className={s.tasksText}>
              <span className={s.cardTitle}>{t.doneOf(tasks.done, tasks.due)}</span>
            </div>
          </div>
          <Figures
            items={[
              { label: t.done, value: String(tasks.done) },
              { label: t.due, value: String(tasks.due) },
              { label: t.missed, value: String(tasks.missed), tone: tasks.missed > 0 ? 'danger' : undefined },
              { label: t.rest, value: String(tasks.rest) },
            ]}
          />
        </>
      )}
    </section>
  )
}

function HabitsCard({ habits }: { habits: WeekReview['habits'] }) {
  const t = useReviewT().habits
  return (
    <section className={s.card} aria-label={t.title}>
      <h2 className={s.cardTitle}>{t.title}</h2>
      {habits.length === 0 ? (
        <p className={s.hint}>{t.none}</p>
      ) : (
        <ul className={s.habits}>
          {habits.map((h) => (
            <li key={h.taskId} className={s.habit}>
              <div className={s.habitHead}>
                <span className={s.habitTitle}>{h.title}</span>
                <span className={s.habitMeta}>
                  {/* Short on screen, spelled out for screen readers. */}
                  <span aria-hidden>{t.doneOf(h.done, h.due)}</span>
                  <span className="sr-only">{t.doneOfLabel(h.done, h.due)}</span>
                  {h.streak > 0 && (
                    <span className={s.streak}>
                      <Flame size={14} aria-hidden />
                      <span aria-hidden>{h.streak}</span>
                      <span className="sr-only">{t.streak(h.streak)}</span>
                    </span>
                  )}
                </span>
              </div>
              <ProgressBar value={h.done} max={h.due} label={`${h.title}: ${t.doneOfLabel(h.done, h.due)}`} tone="success" />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** What the week added up to: tasks, habits, English and money. */
export function WeekSummary({ week }: { week: WeekReview }) {
  const t = useReviewT()
  return (
    <>
      <TasksCard tasks={week.tasks} />
      <HabitsCard habits={week.habits} />
      <div className={s.pair}>
        <section className={s.card} aria-label={t.english.title}>
          <h2 className={s.cardTitle}>{t.english.title}</h2>
          <Figures
            className={s.three}
            items={[
              { label: t.english.answered, value: String(week.english.answered) },
              { label: t.english.remembered, value: String(week.english.remembered) },
              { label: t.english.added, value: String(week.english.added) },
            ]}
          />
        </section>
        <section className={s.card} aria-label={t.finance.title}>
          <h2 className={s.cardTitle}>{t.finance.title}</h2>
          {/* Signed as well as coloured: colour alone carries no meaning. */}
          <Figures
            className={s.two}
            items={[
              { label: t.finance.income, value: formatSigned(week.finance.income, 'income'), tone: 'success' },
              { label: t.finance.expense, value: formatSigned(week.finance.expense, 'expense'), tone: 'danger' },
            ]}
          />
        </section>
      </div>
    </>
  )
}
