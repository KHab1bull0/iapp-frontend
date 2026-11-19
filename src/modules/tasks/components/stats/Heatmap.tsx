import { useLayoutEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { formatDay, formatMonthShort, weekdayHeaders } from '@/core/lib/format'
import { useTasksT } from '@/modules/tasks/i18n'
import { heatWeeks, type HeatCell, type HeatDay } from './heatWeeks'
import s from './Heatmap.module.scss'

/** The largest a square grows to when filling a wide card. */
const MAX_CELL = 22

/**
 * A calendar of the last few months, one square a day, darker the more was
 * done: gaps and runs are visible at a glance. `compact` (a task's editor, a narrow panel) uses smaller squares so
 * the whole range fits beside the weekday names without scrolling.
 * `single` is one task's map: it is done at most once a day, so a day is
 * just done or not, with no "less … more" scale under it.
 */
export function Heatmap({
  days,
  compact = false,
  single = false,
}: {
  days: HeatDay[]
  compact?: boolean
  single?: boolean
}) {
  const t = useTasksT()
  const weeks = heatWeeks(days)
  const active = days.filter((d) => d.count > 0).length
  const labels = weekdayHeaders()
  const scroller = useRef<HTMLDivElement>(null)
  const wrap = useRef<HTMLDivElement>(null)
  // The squares grow to fill the card's width (up to MAX_CELL), so the grid
  // ends at the card's edge instead of leaving a gap on the right. Below the
  // CSS size they stay at it, and the grid scrolls.
  const [cell, setCell] = useState<number | null>(null)

  useLayoutEffect(() => {
    const el = scroller.current
    const box = wrap.current
    if (!el || !box || weeks.length === 0) return
    const fit = () => {
      const css = getComputedStyle(box)
      const base = parseFloat(css.getPropertyValue('--cell-min')) || 11
      const gap = parseFloat(css.getPropertyValue('--gap')) || 2
      const fill = (el.clientWidth - gap * (weeks.length - 1)) / weeks.length - 0.01
      setCell(Math.min(MAX_CELL, Math.max(base, fill)))
    }
    fit()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null
    ro?.observe(el)
    return () => ro?.disconnect()
  }, [weeks.length])

  // Open on the newest weeks when the range is wider than the card.
  useLayoutEffect(() => {
    const el = scroller.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [weeks.length, cell])

  const title = (c: HeatCell) =>
    single ? t.stats.cellDone(formatDay(c.day), c.count > 0) : t.stats.cellLabel(formatDay(c.day), c.count)

  return (
    <div
      ref={wrap}
      className={clsx(s.wrap, compact && s.compact)}
      style={cell ? ({ '--cell': `${cell}px` } as React.CSSProperties) : undefined}
    >
      <div className={s.frame}>
        {/* Outside the scroller, so the weekday names stay in view however far it scrolls. */}
        <div className={s.weekdays} aria-hidden>
          {labels.map((l, i) => (
            <span key={l}>{i % 2 === 0 ? l : ''}</span>
          ))}
        </div>
        <div ref={scroller} className={s.scroller}>
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
          <div className={s.grid} role="img" aria-label={t.stats.activityLabel(active, weeks.length)}>
            {weeks.map((w, i) => (
              <div key={i} className={s.week}>
                {w.map((c, j) =>
                  c ? (
                    <span key={c.day} className={clsx(s.cell, s[`l${c.level}`])} title={title(c)} />
                  ) : (
                    <span key={`pad-${j}`} className={s.pad} />
                  ),
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      {!single && (
        <div className={s.legend} aria-hidden>
          {t.stats.less}
          {[0, 1, 2, 3, 4].map((l) => (
            <span key={l} className={clsx(s.cell, s[`l${l}`])} />
          ))}
          {t.stats.more}
        </div>
      )}
    </div>
  )
}
