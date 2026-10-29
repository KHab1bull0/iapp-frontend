import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import type { MonthPoint } from '@/modules/finance/api/stats'
import { formatAmount, formatAxis, formatMonthShort, CURRENCY } from '@/core/lib/format'
import s from './MonthlyBarChart.module.scss'

// Short enough that the card reads wide rather than tall.
const CHART_HEIGHT = 150

// Recharts renders these into SVG fill attributes, so they have to be literal
// colours rather than var(--success)/var(--danger). Declared once and shared
// with the legend so the two can't drift apart.
const INCOME_COLOR = '#22C55E'
const EXPENSE_COLOR = '#EF4444'

interface TooltipEntry { name: string; value: number; color: string }
interface CustomTooltipProps { active?: boolean; payload?: TooltipEntry[]; label?: string }

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className={s.card} style={{ padding: '10px 14px', fontSize: 13, minWidth: 140 }}>
      <p style={{ fontWeight: 600, color: 'var(--fg-strong)', marginBottom: 6 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, margin: '2px 0', fontVariantNumeric: 'tabular-nums' }}>
          {p.name}: {formatAmount(p.value ?? 0)} {CURRENCY}
        </p>
      ))}
    </div>
  )
}

interface Props {
  data: MonthPoint[]
}

export function MonthlyBarChart({ data }: Props) {
  const chartData = data.map((d) => ({ ...d, month: formatMonthShort(d.month) }))
  const hasData = data.some((d) => d.income > 0 || d.expense > 0)

  return (
    <div className={s.card}>
      <div className={s.cardHead}>
        <h2 className={s.h3}>Last 6 months</h2>
        <div className={s.barLegend}>
          <span><span className={s.dot} style={{ background: INCOME_COLOR }} />Income</span>
          <span><span className={s.dot} style={{ background: EXPENSE_COLOR }} />Expense</span>
        </div>
      </div>
      {!hasData ? (
        <div className={s.empty} style={{ padding: '40px 20px' }}>
          <div className={s.emptyTitle}>No data yet</div>
          <div className={s.emptySub}>Add transactions to see the chart</div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChart data={chartData} barCategoryGap="30%" barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: 'var(--fg-muted)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              // Compact notation ("1,2 mln"): full so'm figures overflowed the
              // fixed axis width on phones.
              tickFormatter={formatAxis}
              tick={{ fontSize: 11, fill: 'var(--fg-muted)' }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--row-hover)', radius: 4 }} />
            <Bar dataKey="income"  name="Income"  fill={INCOME_COLOR}  radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" name="Expense" fill={EXPENSE_COLOR} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export function MonthlyBarChartSkeleton() {
  return (
    <div className={s.card} style={{ opacity: 0.6 }}>
      <div className={s.cardHead}>
        <div style={{ height: 16, width: 120, background: 'var(--border)', borderRadius: 4 }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: CHART_HEIGHT, paddingTop: 16 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ flex: 1, background: 'var(--border)', borderRadius: '4px 4px 0 0', opacity: 0.5 + i * 0.1 }} />
            <div style={{ height: 12, background: 'var(--border)', borderRadius: 4, width: '60%', margin: '0 auto' }} />
          </div>
        ))}
      </div>
    </div>
  )
}
