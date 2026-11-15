import clsx from 'clsx'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, Plus, RefreshCw } from 'lucide-react'
import { EmptyState } from '@/core/components/ui/EmptyState'
import { Skeleton } from '@/core/components/ui/Skeleton'
import { useQuickAdd } from '@/core/quickAdd/context'
import { useToday } from '@/core/hooks/useToday'
import { formatDay, formatWeekday } from '@/core/lib/format'
import { englishKeys, fetchStats, type Stats } from '@/modules/english/api/english'
import { useEnglishT } from '@/modules/english/i18n'
import { Loading, SkeletonText } from '@/modules/english/components/Loading'
import s from '../EnglishPages.module.scss'
import st from './StatsPage.module.scss'
import v from './StatsVisuals.module.scss'
import { TodayCard, VocabularyCard } from './StatsVisuals'

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

/** Placeholder columns: a skyline of different heights, as days with answers would be. */
const COLUMN_HEIGHTS = [30, 55, 20, 70, 45, 60, 25, 80, 50, 35, 65, 40, 75, 55]

/** A legend-like list of rows: swatch, label, value. */
function FactsSkeleton({ rows }: { rows: number }) {
  return (
    <ul className={v.facts}>
      {Array.from({ length: rows }, (_, i) => (
        <li key={i}>
          <Skeleton width={10} height={10} radius={3} />
          <span className={v.factLabel}>
            <SkeletonText width={`${70 - i * 12}%`} line={20} />
          </span>
          <SkeletonText width={24} line={20} />
        </li>
      ))}
    </ul>
  )
}

function ColumnsSkeleton({ heights, wide }: { heights: number[]; wide?: boolean }) {
  return (
    <ol className={clsx(st.columns, wide && st.wide)}>
      {heights.map((h, i) => (
        <li key={i} className={st.column}>
          {wide && <SkeletonText width={12} line={16} />}
          <span className={st.stack}>
            <Skeleton height={`${h}%`} radius="4px 4px 0 0" />
          </span>
          <SkeletonText width={16} line={16} />
        </li>
      ))}
    </ol>
  )
}

/**
 * Statistics while they load: the same four cards in the same grid, each
 * headed by its real title, the figures as blocks.
 */
function StatsSkeleton() {
  const t = useEnglishT()
  return (
    <Loading className={s.page}>
      <div className={st.pair}>
        <section className={st.card}>
          <div className={st.cardHead}>
            <h2 className={st.cardTitle}>{t.stats.today}</h2>
          </div>
          <div className={v.ringRow}>
            <Skeleton width={112} height={112} radius="50%" />
            <FactsSkeleton rows={3} />
          </div>
          <Skeleton width={160} height="var(--control-md)" radius={12} />
        </section>
        <section className={st.card}>
          <div className={st.cardHead}>
            <h2 className={st.cardTitle}>{t.stats.vocabulary}</h2>
            <SkeletonText width={80} line={18} />
          </div>
          <SkeletonText width={120} line={40} />
          <SkeletonText width="45%" line={18} className={v.learned} />
          <Skeleton height={14} radius={4} />
          <FactsSkeleton rows={2} />
        </section>
      </div>
      <div className={st.pair}>
        <section className={st.card}>
          <div className={st.cardHead}>
            <h2 className={st.cardTitle}>{t.stats.activity}</h2>
          </div>
          <ColumnsSkeleton heights={COLUMN_HEIGHTS} />
        </section>
        <section className={st.card}>
          <h2 className={st.cardTitle}>{t.stats.upcoming}</h2>
          <ColumnsSkeleton heights={COLUMN_HEIGHTS.slice(0, 7)} wide />
        </section>
      </div>
    </Loading>
  )
}

/**
 * English → Statistics, drawn rather than listed: today's stack as a ring,
 * the vocabulary split by level, the last two weeks of answers and what the
 * next week brings.
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

  if (isLoading || !data) return <StatsSkeleton />

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
        <VocabularyCard stats={data} />
      </div>
      <div className={st.pair}>
        <Activity days={data.activity} />
        <Upcoming days={data.upcoming} />
      </div>
      {(data.tags ?? []).some((tg) => tg.count > 0) && (
        <BarRows
          title={t.stats.byTag}
          rows={[
            ...data.tags
              .filter((tg) => tg.count > 0)
              .map((tg) => ({ key: tg.id, label: tg.name, count: tg.count })),
            ...(data.untagged ? [{ key: 'none', label: t.stats.untagged, count: data.untagged }] : []),
          ]}
        />
      )}
    </div>
  )
}
