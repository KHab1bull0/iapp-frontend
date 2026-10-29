import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { SlidersHorizontal } from 'lucide-react'
import { useMobileFilter } from './MobileFilterContext'
import s from '@/core/layout/AppLayout.module.scss'

/** On the transactions list the mobile header's slot opens the filter drawer. */
export function FinanceHeaderAction({ fallback }: { fallback: ReactNode }) {
  const { pathname } = useLocation()
  const { filterOpen } = useMobileFilter()

  if (pathname !== '/finance/transactions' || !filterOpen) return <>{fallback}</>

  return (
    <button className={s.iconBtn} onClick={filterOpen} aria-label="Open filters">
      <SlidersHorizontal size={18} />
    </button>
  )
}
