import { Skeleton } from '@/core/components/ui/Skeleton'
import { useTasksT } from '@/modules/tasks/i18n'
import p from '@/modules/tasks/pages/TasksPages.module.scss'
import s from './Skeletons.module.scss'

// Loading shapes for the tasks module, each the size of what it stands in
// for. A loading container sets aria-busy and carries a LoadingLabel; the
// shapes themselves are hidden from screen readers (Skeleton is aria-hidden).

/** What a screen reader hears inside a loading container; nothing on screen. */
export function LoadingLabel({ label }: { label?: string }) {
  const t = useTasksT()
  return <span className="sr-only">{label ?? t.loading}</span>
}

// Varied, so a list of placeholders reads as rows rather than a barcode.
const TITLE_W = ['62%', '48%', '70%', '55%', '40%']
const META_W = ['30%', '22%', '36%', '26%', '18%']

/** A TaskRow: its title and meta lines and, where tasks are ticked, the round tick. */
export function RowSkeleton({ index = 0, tick = true }: { index?: number; tick?: boolean }) {
  return (
    <div className={s.row}>
      <span className={s.rowText}>
        <Skeleton height="var(--lh-ui)" width={TITLE_W[index % TITLE_W.length]} />
        <Skeleton height="var(--lh-meta)" width={META_W[index % META_W.length]} />
      </span>
      {tick && <Skeleton width="var(--tile-sm)" height="var(--tile-sm)" radius="var(--radius-pill)" />}
    </div>
  )
}

export function RowsSkeleton({ count, tick = true }: { count: number; tick?: boolean }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <RowSkeleton key={i} index={i} tick={tick} />
      ))}
    </>
  )
}

/** A list section of the Today and All tasks pages: its label and count, then rows. */
export function SectionSkeleton({ rows, tick = true, index = 0 }: { rows: number; tick?: boolean; index?: number }) {
  return (
    <div className={p.section}>
      <div className={s.sectionHead}>
        <Skeleton height="var(--lh-caption)" width={index % 2 ? 64 : 88} />
        <Skeleton height="var(--lh-caption)" width={16} />
      </div>
      <div className={p.list}>
        <RowsSkeleton count={rows} tick={tick} />
      </div>
    </div>
  )
}

/** A StatTile: the label, the big value and its sub line. */
export function StatTileSkeleton() {
  return (
    <div className={s.tile}>
      <Skeleton height="var(--lh-meta)" width="50%" />
      <Skeleton className={s.tileValue} height="var(--lh-h1)" width="40%" />
      <Skeleton className={s.tileSub} height="var(--lh-caption)" width="65%" />
    </div>
  )
}

/** The Heatmap's block: months, seven rows of days, and its legend. */
export function HeatmapSkeleton() {
  return (
    <div className={s.heatmap}>
      <Skeleton height="calc(var(--lh-caption) + 7 * 13px + 6 * 3px + 4px)" radius="var(--radius-sm)" />
      <Skeleton className={s.heatLegend} height="var(--lh-caption)" width={120} />
    </div>
  )
}

function FieldSkeleton({ label = '30%', height = 'var(--control-md)' }: { label?: string; height?: string }) {
  return (
    <div className={s.field}>
      <Skeleton height="var(--lh-meta)" width={label} />
      <Skeleton height={height} radius="var(--radius-md)" />
    </div>
  )
}

/**
 * The task form while the task it edits loads: name, date and time, repeat,
 * note, and the action row fixed at the bottom (Delete, Cancel, Save).
 */
export function TaskFormSkeleton() {
  return (
    <div className={s.form}>
      <FieldSkeleton label="20%" />
      <div className={s.fieldRow}>
        <FieldSkeleton label="25%" />
        <FieldSkeleton label="25%" />
      </div>
      <FieldSkeleton label="30%" />
      <FieldSkeleton label="15%" height="calc(var(--lh-ui) * 2 + 18px)" />
      <div data-form-actions>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className={s.action} height="var(--control-lg)" radius="var(--radius-md)" />
        ))}
      </div>
    </div>
  )
}
