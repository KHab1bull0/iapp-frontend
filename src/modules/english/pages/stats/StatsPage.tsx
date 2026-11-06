import clsx from 'clsx'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, Plus, RefreshCw } from 'lucide-react'
import { EmptyState } from '@/core/components/ui/EmptyState'
import { StatTile } from '@/core/components/ui/StatTile'
import { useQuickAdd } from '@/core/quickAdd/context'
import { useToday } from '@/core/hooks/useToday'
import { formatDay, formatWeekday } from '@/core/lib/format'
import { englishKeys, fetchStats, type Stats } from '@/modules/english/api/english'
import { useEnglishT, useLevelName } from '@/modules/english/i18n'
import s from '../EnglishPages.module.scss'
import st from './StatsPage.module.scss'

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

/** English → Statistics: the vocabulary at a glance and how review is going. */
export function StatsPage() {
  const t = useEnglishT()
  const levelName = useLevelName()
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

  const answered = data.accuracy.remembered + data.accuracy.forgot
  const accuracy = answered ? `${Math.round((data.accuracy.remembered / answered) * 100)}%` : '—'

  return (
    <div className={s.page}>
      <div className={st.tiles}>
        <StatTile label={t.stats.words} value={String(data.total)} sub={t.stats.addedThisWeek(data.addedThisWeek)} />
        <StatTile
          label={t.stats.due}
          value={String(data.due)}
          sub={data.overdue ? t.stats.overdue(data.overdue) : data.due ? t.vocab.dueToday : t.stats.allDone}
          tone={data.overdue ? 'danger' : 'default'}
        />
        <StatTile label={t.stats.reviewedToday} value={String(data.reviewedToday)} sub={t.stats.answers} />
        <StatTile label={t.stats.streak} value={String(data.streak)} sub={t.stats.streakSub(data.streak)} />
        <StatTile
          label={t.stats.accuracy}
          value={accuracy}
          sub={answered ? t.stats.accuracySub(answered) : t.stats.noAnswers}
        />
        <StatTile label={t.stats.unseen} value={String(data.unseen)} sub={t.stats.unseenSub} />
      </div>

      <BarRows
        title={t.stats.byLevel}
        rows={data.levels.map((l) => ({
          key: l.id,
          label: levelName(l),
          sub: l.locked ? undefined : t.days(l.intervalDays),
          count: l.count,
        }))}
      />
      <Activity days={data.activity} />
      <Upcoming days={data.upcoming} />
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
