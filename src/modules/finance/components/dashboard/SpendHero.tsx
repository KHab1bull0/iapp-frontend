import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CHART } from '@/core/lib/chartColors'
import { CURRENCY, formatAmount } from '@/core/lib/format'
import type { DailySpendPoint } from '@/modules/finance/api/stats'
import { useFinanceT } from '@/modules/finance/i18n'
import { paceVsLast } from '@/modules/finance/lib/pace'
import s from './SpendHero.module.scss'

interface TipProps {
  active?: boolean
  payload?: { dataKey: string; value: number | null; payload: DailySpendPoint }[]
}

function Tip({ active, payload }: TipProps) {
  const t = useFinanceT()
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className={s.tip}>
      <p className={s.tipTitle}>{t.stats.dayLabel(p.day)}</p>
      {p.current !== null && (
        <p style={{ color: CHART.primary }}>
          {t.stats.thisMonth}: {formatAmount(p.current)} {CURRENCY}
        </p>
      )}
      <p className={s.tipMuted}>
        {t.stats.lastMonth}: {formatAmount(p.previous)} {CURRENCY}
      </p>
    </div>
  )
}

/**
 * The dashboard's headline: what this month has cost so far, in big type,
 * and a line of it laid over last month's, so "am I spending faster?" is
 * one glance.
 */
export function SpendHero({
  spent,
  daily,
  title,
  showAmount = true,
}: {
  spent: number
  daily: DailySpendPoint[]
  /** Defaults to "Expenses". */
  title?: string
  /** Off where the amount is already shown (the Statistics page's Expenses tile). */
  showAmount?: boolean
}) {
  const t = useFinanceT()
  const pace = paceVsLast(daily)
  const heading = title ?? t.stats.spent

  return (
    <section className={s.hero} aria-label={heading}>
      <div className={s.label}>{heading}</div>
      {showAmount && (
        <div className={s.amount}>
          {formatAmount(spent)}
          <span className={s.currency}>{CURRENCY}</span>
        </div>
      )}
      {pace && (
        <div className={pace.more ? s.paceUp : s.paceDown}>
          {pace.pct === 0 ? t.stats.sameAsLast : t.stats.vsLast(pace.pct, pace.more)}
        </div>
      )}
      {daily.length > 0 && (
        <>
          <div className={s.chart}>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={daily} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 12, fill: 'var(--fg-muted)' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={24}
                />
                <YAxis hide domain={[0, 'auto']} />
                <Tooltip content={<Tip />} cursor={{ stroke: 'var(--border-strong)' }} />
                <Line
                  dataKey="previous"
                  stroke={CHART.neutral}
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  isAnimationActive={false}
                />
                <Line dataKey="current" stroke={CHART.primary} strokeWidth={3} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className={s.legend} aria-hidden>
            <span>
              <span className={s.swatch} style={{ background: CHART.primary }} />
              {t.stats.thisMonth}
            </span>
            <span>
              <span className={s.swatchDashed} />
              {t.stats.lastMonth}
            </span>
          </div>
        </>
      )}
    </section>
  )
}
