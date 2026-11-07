import { Link } from 'react-router-dom'
import { ModuleCardBoundary } from '@/core/components/ModuleCardBoundary'
import { PageHeader } from '@/core/components/ui/PageHeader'
import { useProfile } from '@/core/hooks/useProfile'
import { formatFullDate } from '@/core/lib/format'
import { MODULES } from '@/modules/registry'
import { useText } from '@/core/i18n'
import { useCoreT } from '@/core/i18n/useCoreT'
import s from './HomePage.module.scss'

// The report's own order: money first, then the day's tasks, then the rest
// in menu order. The menu itself keeps the registry's order.
const HOME_FIRST = ['finance', 'tasks']
const homeRank = (id: string) => {
  const i = HOME_FIRST.indexOf(id)
  return i < 0 ? HOME_FIRST.length : i
}
const HOME_MODULES = [...MODULES].sort((a, b) => homeRank(a.id) - homeRank(b.id))

function greetingKey(hour: number): 'morning' | 'afternoon' | 'evening' {
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 18) return 'afternoon'
  return 'evening'
}

/** Today: a greeting, then each module's card answering "what now?" for its part of the day. */
export function HomePage() {
  const t = useCoreT()
  const text = useText()
  const { displayName } = useProfile()
  const now = new Date()
  const firstName = displayName.split(' ')[0]

  return (
    <div className={s.page}>
      <PageHeader
        compactBar
        title={`${t.greeting[greetingKey(now.getHours())]}${firstName ? `, ${firstName}` : ''}`}
        subtitle={formatFullDate(now)}
        actions={
          // Settings lives behind the avatar rather than taking a bottom-bar slot.
          <Link to="/settings" className={s.avatar} aria-label={t.nav.settings}>
            {(displayName[0] ?? 'U').toUpperCase()}
          </Link>
        }
      />
      <div className={s.grid}>
        {HOME_MODULES.map(({ id, name, homeCard: Card }) =>
          Card ? (
            <ModuleCardBoundary key={id} moduleName={text(name)}>
              <Card />
            </ModuleCardBoundary>
          ) : null,
        )}
      </div>
    </div>
  )
}
