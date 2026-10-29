import clsx from 'clsx'
import type { LucideIcon } from 'lucide-react'
import { formatAmount, CURRENCY } from '@/core/lib/format'
import s from './StatCard.module.scss'

interface StatCardProps {
  title: string
  value: number
  icon: LucideIcon
  tone: 'brand' | 'success' | 'danger'
  /** Period the figure covers. The card used to hardcode "All time" while the
   *  dashboard was already scoped to the selected month. */
  period: string
  /** 'lg' is the headline figure; 'sm' sits two to a row under it. */
  size?: 'lg' | 'sm'
}

const toneIconClass: Record<string, string> = {
  brand:   s.toneBrand,
  success: s.toneSuccess,
  danger:  s.toneDanger,
}

const toneNumClass: Record<string, string> = {
  brand:   s.toneBrandNum,
  success: s.toneSuccessNum,
  danger:  s.toneDangerNum,
}

export function StatCard({ title, value, icon: Icon, tone, period, size = 'lg' }: StatCardProps) {
  return (
    <div className={clsx(s.card, s.statCard, size === 'sm' && s.small)}>
      <div className={s.statHead}>
        <span className={s.labelTiny}>{title}</span>
        <span className={clsx(s.statIcon, toneIconClass[tone])}>
          <Icon size={size === 'sm' ? 15 : 18} />
        </span>
      </div>
      <div className={clsx(s.statNum, toneNumClass[tone])}>
        {value < 0 ? '−' : ''}{formatAmount(Math.abs(value))}
        <span className={s.statCurrency}>{CURRENCY}</span>
      </div>
      <div className={s.statDelta}>{period}</div>
    </div>
  )
}

export function StatCardSkeleton({ size = 'lg' }: { size?: 'lg' | 'sm' }) {
  return (
    <div className={clsx(s.card, s.statCard, size === 'sm' && s.small)} style={{ opacity: 0.6 }}>
      <div className={s.statHead}>
        <div style={{ height: 11, width: 80, background: 'var(--border)', borderRadius: 4 }} />
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--border)' }} />
      </div>
      <div style={{ height: 34, width: 120, background: 'var(--border)', borderRadius: 6, marginTop: 4 }} />
      <div style={{ height: 12, width: 50, background: 'var(--border)', borderRadius: 4, marginTop: 8 }} />
    </div>
  )
}
