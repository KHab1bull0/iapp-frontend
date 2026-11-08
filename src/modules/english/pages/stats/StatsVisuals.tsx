import { Link } from 'react-router-dom'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Flame, Play } from 'lucide-react'
import { ProgressRing } from '@/core/components/ui/Progress'
import { CHART, GREEN_RAMP, rampSteps } from '@/core/lib/chartColors'
import { formatShortDay } from '@/core/lib/format'
import type { Stats } from '@/modules/english/api/english'
import { useEnglishT, useLevelName } from '@/modules/english/i18n'
import st from './StatsPage.module.scss'
import v from './StatsVisuals.module.scss'

const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0)

/** Words not learned yet: lighter than New's gray, as they haven't started. */
const CHART_QUEUED = '#CBD5E1'

/**
 * Today: a ring of how much of today's stack has been answered, the split of
 * those answers, what is left and the streak, with the way into review.
 */
export function TodayCard({ stats }: { stats: Stats }) {
  const t = useEnglishT()
  const today = stats.activity[stats.activity.length - 1] ?? { remembered: 0, forgot: 0 }
  const answered = today.remembered + today.forgot
  const total = answered + stats.due
  const status = stats.due > 0 ? null : answered > 0 ? t.stats.todayDone : t.stats.todayNothing

  return (
    <section className={st.card} aria-label={t.stats.today}>
      <div className={st.cardHead}>
        <h2 className={st.cardTitle}>{t.stats.today}</h2>
        {stats.streak > 0 && (
          <span className={v.streak} title={t.stats.streakSub(stats.streak)}>
            <Flame size={14} aria-hidden /> {t.stats.streakSub(stats.streak)}
          </span>
        )}
      </div>
      <div className={v.ringRow}>
        <ProgressRing
          value={answered}
          max={total}
          size={112}
          stroke={10}
          tone="success"
          label={t.stats.todayRing(answered, total)}
        >
          <span className={v.ringValue}>
            {answered}
            <span className={v.ringOf}>/{total}</span>
          </span>
        </ProgressRing>
        <ul className={v.facts}>
          <li>
            <span className={`${v.swatch} ${v.good}`} aria-hidden />
            <span className={v.factLabel}>{t.stats.rememberedToday}</span>
            <span className={v.factValue}>{today.remembered}</span>
          </li>
          <li>
            <span className={`${v.swatch} ${v.bad}`} aria-hidden />
            <span className={v.factLabel}>{t.stats.forgotToday}</span>
            <span className={v.factValue}>{today.forgot}</span>
          </li>
          <li>
            <span className={`${v.swatch} ${v.rest}`} aria-hidden />
            <span className={v.factLabel}>{t.stats.leftToday}</span>
            <span className={v.factValue}>
              {stats.due}
              {stats.overdue > 0 && <span className={v.overdue}> · {t.stats.overdue(stats.overdue)}</span>}
            </span>
          </li>
        </ul>
      </div>
      {stats.queued > 0 && <p className={st.muted}>{t.stats.newToday(stats.newLeft, stats.newPerDay)}</p>}
      {status ? (
        <p className={st.muted}>{status}</p>
      ) : (
        <Link to="/english/review" className={v.start}>
          <Play size={16} aria-hidden /> {t.stats.start}
        </Link>
      )}
    </section>
  )
}

/** Remembering: the last 30 days' answers as a ring of the share remembered, and the split as a bar. */
export function AccuracyCard({ stats }: { stats: Stats }) {
  const t = useEnglishT()
  const { remembered, forgot } = stats.accuracy
  const answered = remembered + forgot
  const share = pct(remembered, answered)

  return (
    <section className={st.card} aria-label={t.stats.accuracy}>
      <h2 className={st.cardTitle}>{t.stats.accuracy}</h2>
      <div className={v.ringRow}>
        <ProgressRing
          value={remembered}
          max={answered}
          size={112}
          stroke={10}
          tone="primary"
          label={t.stats.accuracyRing(share)}
        >
          <span className={v.ringValue}>{answered ? `${share}%` : '—'}</span>
        </ProgressRing>
        <div className={v.split}>
          <p className={st.muted}>{answered ? t.stats.accuracySub(answered) : t.stats.noAnswers}</p>
          {answered > 0 && (
            <>
              <div className={v.splitBar} aria-hidden>
                {remembered > 0 && <span className={v.good} style={{ flexGrow: remembered }} />}
                {forgot > 0 && <span className={v.bad} style={{ flexGrow: forgot }} />}
              </div>
              <div className={st.legend}>
                <span>
                  <span className={`${st.dot} ${st.good}`} />
                  {t.review.remembered} {remembered}
                </span>
                <span>
                  <span className={`${st.dot} ${st.bad}`} />
                  {t.review.forgot} {forgot}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

/**
 * The vocabulary: how many words, and one bar split by level — New in gray,
 * then light to dark green as the gap before a word comes back grows. Words
 * past New are the ones remembered at least once.
 */
export function VocabularyCard({ stats }: { stats: Stats }) {
  const t = useEnglishT()
  const levelName = useLevelName()
  const steps = rampSteps(GREEN_RAMP, stats.levels.filter((l) => !l.locked).length)
  let step = 0
  const levels = [
    // Not learned yet: waiting in the queue, the palest part of the bar.
    ...(stats.queued
      ? [{ id: 'queued', locked: true, intervalDays: 0, count: stats.queued, label: t.stats.queued, color: CHART_QUEUED, share: pct(stats.queued, stats.total) }]
      : []),
    ...stats.levels.map((l) => ({
      ...l,
      label: levelName(l),
      color: l.locked ? CHART.neutral : steps[step++],
      share: pct(l.count, stats.total),
    })),
  ]
  const learned = levels.filter((l) => !l.locked).reduce((n, l) => n + l.count, 0)

  return (
    <section className={st.card} aria-label={t.stats.vocabulary}>
      <div className={st.cardHead}>
        <h2 className={st.cardTitle}>{t.stats.vocabulary}</h2>
        <span className={st.muted}>{t.stats.addedThisWeek(stats.addedThisWeek)}</span>
      </div>
      <div className={v.total}>
        <span className={v.totalValue}>{stats.total}</span>
        <span className={v.totalUnit}>{t.stats.wordsTotal}</span>
      </div>
      <p className={v.learned}>{t.stats.learned(learned, pct(learned, stats.total))}</p>
      <div className={v.levelBar} role="img" aria-label={levels.map((l) => t.stats.levelShare(l.label, l.count, l.share)).join('; ')}>
        {levels
          .filter((l) => l.count > 0)
          .map((l) => (
            <span
              key={l.id}
              style={{ flexGrow: l.count, background: l.color }}
              title={t.stats.levelShare(l.label, l.count, l.share)}
            />
          ))}
      </div>
      <ul className={v.levelLegend}>
        {levels.map((l) => (
          <li key={l.id}>
            <span className={v.swatch} style={{ background: l.color }} aria-hidden />
            <span className={v.factLabel}>
              {l.label}
              {!l.locked && l.label !== t.days(l.intervalDays) && <span className={st.rowSub}> · {t.days(l.intervalDays)}</span>}
            </span>
            <span className={v.factValue}>{l.count}</span>
            <span className={v.share}>{l.share}%</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function GrowthTip({ active, payload }: { active?: boolean; payload?: { payload: { date: string; total: number } }[] }) {
  const t = useEnglishT()
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className={v.tip}>
      <p className={v.tipTitle}>{formatShortDay(p.date)}</p>
      <p>{t.stats.growthTip(p.total)}</p>
    </div>
  )
}

/** The vocabulary's size day by day over the last 30 days: a rising area. */
export function GrowthCard({ growth }: { growth: Stats['growth'] }) {
  const t = useEnglishT()
  if (growth.length === 0) return null
  const delta = growth[growth.length - 1].total - growth[0].total
  return (
    <section className={st.card} aria-label={t.stats.growth}>
      <div className={st.cardHead}>
        <h2 className={st.cardTitle}>{t.stats.growth}</h2>
        <span className={st.muted}>{t.stats.growthDelta(delta)}</span>
      </div>
      <div className={v.chart}>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={growth} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="english-growth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART.primary} stopOpacity={0.28} />
                <stop offset="100%" stopColor={CHART.primary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tickFormatter={formatShortDay}
              tick={{ fontSize: 12, fill: 'var(--fg-muted)' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={32}
            />
            <YAxis hide domain={[0, 'auto']} />
            <Tooltip content={<GrowthTip />} cursor={{ stroke: 'var(--border-strong)' }} />
            <Area
              type="monotone"
              dataKey="total"
              stroke={CHART.primary}
              strokeWidth={2}
              fill="url(#english-growth)"
              isAnimationActive={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--bg-elev)' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
