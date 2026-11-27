import clsx from 'clsx'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, DollarSign } from 'lucide-react'
import { formatAmount, todayYmd } from '@/core/lib/format'
import { fetchUsdRate, ratesKeys } from '@/modules/finance/api/rates'
import { useFinanceT } from '@/modules/finance/i18n'
import s from './RateBadge.module.scss'

/** Today's dollar rate, small; it opens the rate page in Finance settings. An empty slot while none is known. */
export function RateBadge({ className }: { className?: string }) {
  const t = useFinanceT()
  const today = todayYmd()
  const { data } = useQuery({ queryKey: ratesKeys.usd(today), queryFn: () => fetchUsdRate(today) })
  if (!data?.rate) return <div className={clsx(s.slot, className)} aria-hidden />
  const rate = formatAmount(Math.round(data.rate))
  return (
    <div className={clsx(s.slot, className)}>
      <Link to="/finance/settings/rate" className={s.badge} aria-label={t.rate.badgeLabel(rate)}>
        <DollarSign size={13} aria-hidden />
        <span>{t.rate.badge(rate)}</span>
        <ChevronRight size={13} aria-hidden className={s.chev} />
      </Link>
    </div>
  )
}
