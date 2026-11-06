import clsx from 'clsx'
import { formatDay, formatMonthShort, weekdayHeaders } from '@/core/lib/format'
import { useTasksT } from '@/modules/tasks/i18n'
import { heatWeeks } from './heatWeeks'
import s from './Heatmap.module.scss'

/**
 * A calendar of the last few months, one square a day, darker the more was
 * done: gaps and runs are visible at a glance.
 */
export function Heatmap({ days }: { days: { day: string; count: number }[] }) {
  const t = useTasksT()
  const weeks = heatWeeks(days)
  const active = days.filter((d) => d.count > 0).length
  const labels = weekdayHeaders()

  return (
    <div className={s.wrap}>
      <div className={s.scroller}>
        <div className={s.months} aria-hidden>
          {weeks.map((w, i) => {
            const first = w.find((c) => c && c.day.endsWith('-01')) ?? (i === 0 ? w.find(Boolean) : undefined)
            return (
              <span key={i} className={s.month}>
                {first ? formatMonthShort(first.day.slice(0, 7)) : ''}
              </span>
            )
          })}
        </div>
        <div className={s.body}>
          <div className={s.weekdays} aria-hidden>
            {labels.map((l, i) => (
              <span key={l}>{i % 2 === 0 ? l : ''}</span>
            ))}
          </div>
          <div className={s.grid} role="img" aria-label={t.stats.activityLabel(active, weeks.length)}>
            {weeks.map((w, i) => (
              <div key={i} className={s.week}>
                {w.map((c, j) =>
                  c ? (
                    <span key={c.day} className={clsx(s.cell, s[`l${c.level}`])} title={t.stats.cellLabel(formatDay(c.day), c.count)} />
                  ) : (
                    <span key={`pad-${j}`} className={s.pad} />
                  ),
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className={s.legend} aria-hidden>
        {t.stats.less}
        {[0, 1, 2, 3, 4].map((l) => (
          <span key={l} className={clsx(s.cell, s[`l${l}`])} />
        ))}
        {t.stats.more}
      </div>
    </div>
  )
}
