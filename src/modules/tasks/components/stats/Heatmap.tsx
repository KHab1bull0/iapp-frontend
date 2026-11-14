import clsx from 'clsx'
import { formatDay, formatMonthShort, weekdayHeaders } from '@/core/lib/format'
import { useTasksT } from '@/modules/tasks/i18n'
import { heatWeeks, type HeatCell, type HeatDay } from './heatWeeks'
import s from './Heatmap.module.scss'

/**
 * A calendar of the last few months, one square a day, darker the more was
 * done: gaps and runs are visible at a glance. A habit's two-minute days are
 * lighter and its rest days carry their own neutral mark (not "missed").
 */
export function Heatmap({ days }: { days: HeatDay[] }) {
  const t = useTasksT()
  const weeks = heatWeeks(days)
  const active = days.filter((d) => d.count > 0).length
  const labels = weekdayHeaders()
  const hasMin = days.some((d) => (d.min ?? 0) > 0)
  const hasRest = days.some((d) => d.rest)

  const title = (c: HeatCell) => {
    const date = formatDay(c.day)
    if (c.rest) return t.stats.cellRest(date)
    if (c.min) return t.stats.cellMin(date)
    return t.stats.cellLabel(date, c.count)
  }

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
                    <span key={c.day} className={clsx(s.cell, s[`l${c.level}`], c.rest && s.rest)} title={title(c)} />
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
        {hasMin && (
          <span className={s.legendItem}>
            <span className={clsx(s.cell, s.l2)} /> {t.stats.minLegend}
          </span>
        )}
        {hasRest && (
          <span className={s.legendItem}>
            <span className={clsx(s.cell, s.l0, s.rest)} /> {t.stats.restLegend}
          </span>
        )}
      </div>
    </div>
  )
}
