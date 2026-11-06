import { Area, Bar, CartesianGrid, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CHART } from '@/core/lib/chartColors'
import { useTasksT } from '@/modules/tasks/i18n'
import s from './TaskStats.module.scss'

export const TOTAL_COLOR = CHART.primary
/** The per-day +1 bars under one task's line. */
export const DONE_COLOR = CHART.primarySoft

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
  cumulative: number
}

interface TooltipEntry { dataKey: string; name: string; value: number; color: string; payload: ChartPoint }
interface TooltipProps { active?: boolean; payload?: TooltipEntry[] }

function ChartTooltip({ active, payload }: TooltipProps) {
  const t = useTasksT()
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div className={s.tooltip}>
      <p className={s.tooltipTitle}>{point.title}</p>
      {payload
        .filter((p) => p.dataKey !== 'cumulative')
        .map((p) => (
          <p key={p.dataKey} style={{ color: p.color }}>
            {p.name}: +{p.value}
          </p>
        ))}
      <p className={s.tooltipTotal}>
        {t.stats.cumulative}: {point.cumulative}
      </p>
    </div>
  )
}

/**
 * The running total as a rising area, with what was done on each day (or
 * month) as small bars along the bottom. The bars get their own hidden axis
 * scaled to three times their peak, so they stay in the lower third and never
 * hide the line.
 */
export function ProgressChart({ data, bars, height = 180 }: { data: ChartPoint[]; bars: BarSeries[]; height?: number }) {
  const t = useTasksT()
  return (
    <div className={s.chart}>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="tasks-total-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={TOTAL_COLOR} stopOpacity={0.28} />
              <stop offset="100%" stopColor={TOTAL_COLOR} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'var(--fg-muted)' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={16}
          />
          <YAxis
            yAxisId="total"
            allowDecimals={false}
            tick={{ fontSize: 11, fill: 'var(--fg-muted)' }}
            axisLine={false}
            tickLine={false}
            width={32}
          />
          <YAxis yAxisId="count" hide allowDecimals={false} domain={[0, (max: number) => Math.max(1, max) * 3]} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--row-hover)' }} />
          {bars.map((b) => (
            <Bar
              key={b.key}
              yAxisId="count"
              dataKey={b.key}
              name={b.label}
              stackId="count"
              fill={b.color}
              maxBarSize={14}
              isAnimationActive={false}
            />
          ))}
          <Area
            yAxisId="total"
            type="monotone"
            dataKey="cumulative"
            name={t.stats.cumulative}
            stroke={TOTAL_COLOR}
            strokeWidth={2}
            fill="url(#tasks-total-fill)"
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
