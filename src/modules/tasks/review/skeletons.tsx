import { Skeleton } from '@/core/components/ui/Skeleton'
import s from './Review.module.scss'

// The review page's cards in outline, each sized as the card it stands in
// for (Review.module.scss), so nothing moves when the week arrives. The
// container that shows them sets aria-busy and the loading label.

const line = (height: string, width: number | string) => <Skeleton height={height} width={width} />

/** The tasks card (ring and three counts) and the habits card (two habits). */
export function WeekSummarySkeleton() {
  return (
    <>
      <div className={s.card}>
        {line('var(--lh-title)', 96)}
        <div className={s.tasksTop}>
          <Skeleton width={72} height={72} radius="var(--radius-pill)" />
          <div className={s.tasksText}>{line('var(--lh-title)', 160)}</div>
        </div>
        <div className={s.figures}>
          {[0, 1, 2].map((i) => (
            <div key={i}>
              {line('var(--lh-caption)', '60%')}
              {line('var(--lh-title)', '40%')}
            </div>
          ))}
        </div>
      </div>
      <div className={s.card}>
        {line('var(--lh-title)', 80)}
        <div className={s.habits}>
          {['55%', '40%'].map((w) => (
            <div key={w} className={s.habit}>
              <div className={s.habitHead}>
                {line('var(--lh-ui)', w)}
                {line('var(--lh-meta)', 40)}
              </div>
              <Skeleton height={8} radius="var(--radius-pill)" />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

/** The questions card: its heading and save status, the hint, three fields. */
export function QuestionsSkeleton() {
  return (
    <div className={s.card}>
      <div className={s.cardHead}>
        {line('var(--lh-title)', 96)}
        <span className={s.status} />
      </div>
      {line('var(--lh-meta)', '85%')}
      {[0, 1, 2].map((i) => (
        <div key={i} className={s.field}>
          {line('var(--lh-meta)', '45%')}
          <Skeleton height={88} radius="var(--radius-md)" />
        </div>
      ))}
    </div>
  )
}

/** Past weeks: three rows of range, badge and rate. */
export function PastWeeksSkeleton() {
  return (
    <ul className={s.weeks} aria-hidden>
      {[0, 1, 2].map((i) => (
        <li key={i} className={s.weekRow}>
          <span className={s.weekRange}>{line('var(--lh-ui)', i % 2 ? '50%' : '60%')}</span>
          <Skeleton height={24} width={72} radius="var(--radius-pill)" />
          {line('var(--lh-ui)', 32)}
          <Skeleton height={18} width={18} />
        </li>
      ))}
    </ul>
  )
}
