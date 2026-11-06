import { Link } from 'react-router-dom'
import { ModuleCardBoundary } from '@/core/components/ModuleCardBoundary'
import { PageHeader } from '@/core/components/ui/PageHeader'
import { useProfile } from '@/core/hooks/useProfile'
import { formatFullDate } from '@/core/lib/format'
import { MODULES } from '@/modules/registry'
import { useText } from '@/core/i18n'
import { useCoreT } from '@/core/i18n/useCoreT'
import s from './HomePage.module.scss'

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
        {MODULES.map(({ id, name, homeCard: Card }) =>
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
