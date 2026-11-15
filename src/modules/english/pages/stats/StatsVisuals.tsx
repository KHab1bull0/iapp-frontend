import { Link } from 'react-router-dom'
import { Flame, Play } from 'lucide-react'
import { ProgressRing } from '@/core/components/ui/Progress'
import { CHART, GREEN_RAMP, rampSteps } from '@/core/lib/chartColors'
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
