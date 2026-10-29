import { useProfile } from '@/core/hooks/useProfile'
import { ModuleCardBoundary } from '@/core/components/ModuleCardBoundary'
import { formatFullDate } from '@/core/lib/format'
import { MODULES } from '@/modules/registry'
import s from './HomePage.module.scss'

function greeting(hour: number): string {
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

/** Today across every module: each one contributes its own card. */
export function HomePage() {
  const { displayName } = useProfile()
  const now = new Date()

  return (
    <div className={s.page}>
      <header>
        <h1 className={s.h1}>
          {greeting(now.getHours())}
          {displayName ? `, ${displayName}` : ''}
        </h1>
        <div className={s.pageSub}>{formatFullDate(now)}</div>
      </header>

      <div className={s.grid}>
        {MODULES.map(({ id, name, homeCard: Card }) =>
          Card ? (
            <ModuleCardBoundary key={id} moduleName={name}>
              <Card />
            </ModuleCardBoundary>
          ) : null,
        )}
      </div>
    </div>
  )
}
