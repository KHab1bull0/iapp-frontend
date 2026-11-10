import { useLayoutEffect, useRef, useState } from 'react'
import { Area, Bar, CartesianGrid, ComposedChart, Tooltip, XAxis, YAxis } from 'recharts'
import { CHART } from '@/core/lib/chartColors'
import { useTasksT } from '@/modules/tasks/i18n'
import s from './TaskStats.module.scss'

const TOTAL_COLOR = CHART.primary

const TICK_FONT = 11
/** Roughly a character's width at TICK_FONT; a label's slot also keeps room around it. */
const CHAR_W = 6.5
const SLOT_PAD = 12
const MIN_SLOT = 24
/** The y axis, which stays put while the chart scrolls under it. */
const Y_AXIS_W = 28
const SIDE = 4
const TOP = 8
/** The x axis: a dot under each bar, then its label. */
const X_AXIS_H = 28
const DOT_Y = 5

/**
 * Under each bar: a dot, so it's plain which bar a label belongs to (filled
 * when something was done that day), then the label.
 */
function AxisTick({ x, y, payload, index, data, keys }: {
  x?: number
  y?: number
  payload?: { value: string }
  index?: number
  data: ChartPoint[]
  keys: string[]
}) {
  const point = data[index ?? 0] as unknown as Record<string, unknown> | undefined
  const active = keys.some((k) => Number(point?.[k]) > 0)
  return (
    <g>
      <circle
        cx={x}
        cy={(y ?? 0) + DOT_Y}
        r={2}
        fill={active ? TOTAL_COLOR : 'var(--border-strong)'}
      />
      <text
        x={x}
        y={(y ?? 0) + DOT_Y + 6}
        dy={TICK_FONT * 0.8}
        textAnchor="middle"
        fontSize={TICK_FONT}
        fill="var(--fg-muted)"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {payload?.value}
      </text>
    </g>
  )
}

/** The bars stay thin, so the line above stays the chart's main mark. */
const BAR_MAX = 8
const BAR_RADIUS = 3

interface BarShapeProps {
  x?: number
  y?: number
  width?: number
  height?: number
  fill?: string
  payload?: Record<string, unknown>
}

/**
 * A bar with its top corners rounded. In a stack only the topmost piece of
 * the day is rounded (the series after it are empty), so the joins stay flat.
 */
function barShape(bars: BarSeries[], index: number) {
  const above = bars.slice(index + 1).map((b) => b.key)
  return function BarShape({ x = 0, y = 0, width = 0, height = 0, fill, payload }: BarShapeProps) {
    if (height <= 0 || width <= 0) return <g />
    const top = above.every((k) => !Number(payload?.[k]))
    const r = top ? Math.min(BAR_RADIUS, width / 2, height) : 0
    const d = [
      `M${x},${y + height}`,
      `V${y + r}`,
      r ? `Q${x},${y} ${x + r},${y}` : '',
      `H${x + width - r}`,
      r ? `Q${x + width},${y} ${x + width},${y + r}` : '',
      `V${y + height}`,
      'Z',
    ].join('')
    return <path d={d} fill={fill} />
  }
}

export interface BarSeries {
  key: string
  label: string
  color: string
}

/** One point; it also carries a number under each bar series' key. */
export interface ChartPoint {
  /** Axis tick. */
  label: string
  /** Tooltip heading. */
  title: string
  /** The line's value: the running total, or one task's score. */
  line: number
  /** Days due and not done (only with the score). */
  missed: number
}

interface TooltipEntry { dataKey: string; name: string; value: number; color: string; payload: ChartPoint }
interface TooltipProps { active?: boolean; payload?: TooltipEntry[]; lineLabel: string }

function ChartTooltip({ active, payload, lineLabel }: TooltipProps) {
  const t = useTasksT()
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div className={s.tooltip}>
      <p className={s.tooltipTitle}>{point.title}</p>
      {payload
        .filter((p) => p.dataKey !== 'line')
        .map((p) => (
          <p key={p.dataKey} style={{ color: p.color }}>
            {p.name}: +{p.value}
          </p>
        ))}
      {point.missed > 0 && <p className={s.tooltipMissed}>{t.stats.missedTip(point.missed)}</p>}
      <p className={s.tooltipTotal}>
        {lineLabel}: {point.line}
      </p>
    </div>
  )
}

/**
 * The running total as a rising area, with what was done on each day (or
 * month) as thin bars along the bottom. The bars get their own hidden axis
 * scaled to three times their peak, so they stay in the lower third and never
 * hide the line.
 *
 * Each point gets a slot wide enough for its label; when they don't all fit,
 * the chart scrolls sideways (starting at the latest) while the total's axis
 * stays put on the left.
 */
export function ProgressChart({
  data,
  bars,
  height = 180,
  lineLabel,
}: {
  data: ChartPoint[]
  bars: BarSeries[]
  height?: number
  /** The line's name in the tooltip; the running total's by default. */
  lineLabel?: string
}) {
  const t = useTasksT()
  const label = lineLabel ?? t.stats.cumulative
  // A score can go below zero; the axis then reaches down to it.
  const domain: [(min: number) => number, 'auto'] = [(min) => Math.min(0, min), 'auto']
  const [view, setView] = useState(0)
  const scroller = useRef<HTMLDivElement>(null)

  const longest = Math.max(1, ...data.map((p) => p.label.length))
  const slot = Math.max(MIN_SLOT, longest * CHAR_W + SLOT_PAD)
  const width = Math.max(view, data.length * slot + SIDE)
  const keys = bars.map((b) => b.key)

  useLayoutEffect(() => {
    const el = scroller.current
    if (!el) return
    const measure = () => setView(el.clientWidth)
    measure()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    ro?.observe(el)
    return () => ro?.disconnect()
  }, [])

  // Open on the latest days.
  useLayoutEffect(() => {
    const el = scroller.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [width, data.length])

  const margin = { top: TOP, right: SIDE, bottom: 0, left: 0 }

  return (
    <div className={s.chartRow} style={{ height }}>
      {/* The total's axis, outside the scroll. Same data, so the same scale as the chart beside it. */}
      <ComposedChart width={Y_AXIS_W} height={height} data={data} margin={{ ...margin, right: 0 }} accessibilityLayer={false}>
        <XAxis dataKey="label" height={X_AXIS_H} tick={false} axisLine={false} tickLine={false} />
        <YAxis
          yAxisId="total"
          allowDecimals={false}
          tick={{ fontSize: TICK_FONT, fill: 'var(--fg-muted)' }}
          axisLine={false}
          tickLine={false}
          width={Y_AXIS_W}
          domain={domain}
        />
        <Area yAxisId="total" dataKey="line" stroke="none" fill="none" isAnimationActive={false} />
      </ComposedChart>

      <div ref={scroller} className={s.chartScroll} data-vaul-no-drag>
        <ComposedChart width={width} height={height} data={data} margin={margin} accessibilityLayer={false}>
          <defs>
            <linearGradient id="tasks-total-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={TOTAL_COLOR} stopOpacity={0.28} />
              <stop offset="100%" stopColor={TOTAL_COLOR} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} yAxisId="total" />
          <XAxis
            dataKey="label"
            tick={<AxisTick data={data} keys={keys} />}
            axisLine={false}
            tickLine={false}
            interval={0}
            height={X_AXIS_H}
          />
          <YAxis yAxisId="total" hide allowDecimals={false} domain={domain} />
          <YAxis yAxisId="count" hide allowDecimals={false} domain={[0, (max: number) => Math.max(1, max) * 3]} />
          <Tooltip content={<ChartTooltip lineLabel={label} />} cursor={{ fill: 'var(--row-hover)' }} />
          {bars.map((b, i) => (
            <Bar
              key={b.key}
              yAxisId="count"
              dataKey={b.key}
              name={b.label}
              stackId="count"
              fill={b.color}
              maxBarSize={BAR_MAX}
              shape={barShape(bars, i)}
              isAnimationActive={false}
            />
          ))}
          <Area
            yAxisId="total"
            type="monotone"
            dataKey="line"
            name={label}
            stroke={TOTAL_COLOR}
            strokeWidth={2}
            fill="url(#tasks-total-fill)"
            isAnimationActive={false}
          />
        </ComposedChart>
      </div>
    </div>
  )
}
