import clsx from 'clsx'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, Plus, RefreshCw } from 'lucide-react'
import { EmptyState } from '@/core/components/ui/EmptyState'
import { useQuickAdd } from '@/core/quickAdd/context'
import { useToday } from '@/core/hooks/useToday'
import { formatDay, formatWeekday } from '@/core/lib/format'
import { englishKeys, fetchStats, type Stats } from '@/modules/english/api/english'
import { useEnglishT } from '@/modules/english/i18n'
import s from '../EnglishPages.module.scss'
import st from './StatsPage.module.scss'
import { AccuracyCard, GrowthCard, TodayCard, VocabularyCard } from './StatsVisuals'

/** Horizontal bars, one row per item; the count is always written beside the bar. */
function BarRows({ title, rows }: { title: string; rows: { key: string; label: string; sub?: string; count: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count))
  return (
    <section className={st.card} aria-label={title}>
      <h2 className={st.cardTitle}>{title}</h2>
      <ul className={st.rows}>
        {rows.map((r) => (
          <li key={r.key} className={st.row}>
            <span className={st.rowLabel}>
              {r.label}
              {r.sub && <span className={st.rowSub}> · {r.sub}</span>}
            </span>
            <span className={st.track}>
              {r.count > 0 && <span className={st.bar} style={{ width: `${(r.count / max) * 100}%` }} />}
            </span>
            <span className={st.rowValue}>{r.count}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Activity({ days }: { days: Stats['activity'] }) {
  const t = useEnglishT()
  const max = Math.max(1, ...days.map((d) => d.remembered + d.forgot))
  return (
    <section className={st.card} aria-label={t.stats.activity}>
      <div className={st.cardHead}>
        <h2 className={st.cardTitle}>{t.stats.activity}</h2>
        <div className={st.legend}>
          <span><span className={clsx(st.dot, st.good)} />{t.review.remembered}</span>
          <span><span className={clsx(st.dot, st.bad)} />{t.review.forgot}</span>
        </div>
      </div>
      <ol className={st.columns}>
        {days.map((d) => {
          const label = t.stats.dayLabel(formatDay(d.date), d.remembered, d.forgot)
          return (
            <li key={d.date} className={st.column} title={label} aria-label={label}>
              <span className={st.stack}>
                {d.forgot > 0 && <span className={clsx(st.seg, st.bad)} style={{ height: `${(d.forgot / max) * 100}%` }} />}
                {d.remembered > 0 && (
                  <span className={clsx(st.seg, st.good)} style={{ height: `${(d.remembered / max) * 100}%` }} />
                )}
              </span>
              <span className={st.axis}>{Number(d.date.slice(8))}</span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function Upcoming({ days }: { days: Stats['upcoming'] }) {
  const t = useEnglishT()
  const max = Math.max(1, ...days.map((d) => d.count))
  const none = days.every((d) => d.count === 0)
  return (
    <section className={st.card} aria-label={t.stats.upcoming}>
      <h2 className={st.cardTitle}>{t.stats.upcoming}</h2>
      {none ? (
        <p className={st.muted}>{t.stats.upcomingEmpty}</p>
      ) : (
        <ol className={clsx(st.columns, st.wide)}>
          {days.map((d) => {
            const label = t.stats.upcomingLabel(formatDay(d.date), d.count)
            return (
              <li key={d.date} className={st.column} title={label} aria-label={label}>
                <span className={st.colValue}>{d.count || ''}</span>
                <span className={st.stack}>
                  {d.count > 0 && <span className={clsx(st.seg, st.accent)} style={{ height: `${(d.count / max) * 100}%` }} />}
                </span>
                <span className={st.axis}>{formatWeekday(d.date)}</span>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

/**
 * English → Statistics, drawn rather than listed: today's stack as a ring,
 * how well words stick, the vocabulary split by level, how it has grown, the
 * last two weeks of answers and what the next week brings.
 */
export function StatsPage() {
  const t = useEnglishT()
  const quickAdd = useQuickAdd()
  const today = useToday()
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: englishKeys.stats(today),
    queryFn: () => fetchStats(today),
  })

  if (isError) {
    return (
      <div className={s.page}>
        <EmptyState title={t.stats.failed} action={{ label: t.retry, icon: RefreshCw, onClick: () => void refetch() }} />
      </div>
    )
  }

  if (isLoading || !data) return <div className={s.page} />

  if (data.total === 0) {
    return (
      <div className={s.page}>
        <EmptyState
          icon={BookOpen}
          title={t.stats.empty}
          description={t.stats.emptySub}
          action={{ label: t.review.addWord, icon: Plus, onClick: () => quickAdd.open('english.word') }}
          secondary={{ label: t.stats.openVocabulary, to: '/english/vocabulary' }}
        />
      </div>
    )
  }

  return (
    <div className={s.page}>
      <div className={st.pair}>
        <TodayCard stats={data} />
        <AccuracyCard stats={data} />
      </div>
      <div className={st.pair}>
        <VocabularyCard stats={data} />
        <GrowthCard growth={data.growth ?? []} />
      </div>
      <div className={st.pair}>
        <Activity days={data.activity} />
        <Upcoming days={data.upcoming} />
      </div>
      {data.categories.length > 0 && (
        <BarRows
          title={t.stats.byCategory}
          rows={data.categories.map((c) => ({
            key: c.id ?? 'none',
            label: c.name ?? t.stats.uncategorized,
            count: c.count,
          }))}
        />
      )}
    </div>
  )
}
