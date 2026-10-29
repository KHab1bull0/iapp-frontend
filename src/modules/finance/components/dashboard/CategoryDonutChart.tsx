import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { CategoryBreakdown } from '@/modules/finance/api/stats'
import { formatAmount, CURRENCY } from '@/core/lib/format'
import s from './CategoryDonutChart.module.scss'

// Kept small so the card reads wide rather than tall.
const DONUT = 128
/** Largest categories shown; the rest collapse into "+N more" (the tooltip still has them). */
const LEGEND_MAX = 5

interface PiePayload { name: string; value: number; payload: CategoryBreakdown }
interface CustomTooltipProps { active?: boolean; payload?: PiePayload[] }

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className={s.card} style={{ padding: '10px 14px', fontSize: 13, minWidth: 140 }}>
      <p style={{ fontWeight: 600, color: 'var(--fg-strong)', marginBottom: 4 }}>{d.name}</p>
      <p style={{ color: d.payload.color, fontVariantNumeric: 'tabular-nums' }}>
        {formatAmount(d.value ?? 0)} {CURRENCY}
      </p>
      <p style={{ color: 'var(--fg-muted)', fontSize: 11 }}>{d.payload.percentage}% of expenses</p>
    </div>
  )
}

interface Props {
  data: CategoryBreakdown[]
}

export function CategoryDonutChart({ data }: Props) {
  const expenseData = data.filter((d) => d.type === 'expense')

  return (
    <div className={s.card}>
      <div className={s.cardHead}>
        <h2 className={s.h3}>Spending by category</h2>
        <span className={s.labelTiny}>Expenses</span>
      </div>
      {expenseData.length === 0 ? (
        <div className={s.empty} style={{ padding: '40px 20px' }}>
          <div className={s.emptyTitle}>No expense data yet</div>
          <div className={s.emptySub}>Add expense transactions to see the breakdown</div>
        </div>
      ) : (
        <div className={s.donutWrap}>
          <ResponsiveContainer width={DONUT} height={DONUT}>
            <PieChart>
              <Pie
                data={expenseData}
                dataKey="total"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={60}
                paddingAngle={2}
                strokeWidth={0}
              >
                {expenseData.map((entry) => (
                  <Cell key={entry.categoryId} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          <ul className={s.donutLegend}>
            {expenseData.slice(0, LEGEND_MAX).map((d) => (
              <li key={d.categoryId}>
                <span className={s.donutDot} style={{ background: d.color }} />
                <span className={s.donutName}>{d.icon} {d.name}</span>
                <span className={s.donutPct}>{d.percentage}%</span>
              </li>
            ))}
            {expenseData.length > LEGEND_MAX && (
              <li className={s.donutMore}>+{expenseData.length - LEGEND_MAX} more</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

export function CategoryDonutChartSkeleton() {
  return (
    <div className={s.card} style={{ opacity: 0.6 }}>
      <div className={s.cardHead}>
        <div style={{ height: 16, width: 160, background: 'var(--border)', borderRadius: 4 }} />
      </div>
      <div className={s.donutWrap}>
        <div style={{ width: DONUT, height: DONUT, borderRadius: '50%', background: 'conic-gradient(var(--border) 0deg, var(--border) 360deg)', opacity: 0.4 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '12px 1fr auto', gap: 10, alignItems: 'center' }}>
              <div style={{ width: 12, height: 12, borderRadius: 4, background: 'var(--border)' }} />
              <div style={{ height: 13, background: 'var(--border)', borderRadius: 4 }} />
              <div style={{ height: 13, width: 28, background: 'var(--border)', borderRadius: 4 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
