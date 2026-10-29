import { ModuleCardBoundary } from '@/core/components/ModuleCardBoundary'
import { MODULES } from '@/modules/registry'
import s from './HomePage.module.scss'

/** Every module's card, nothing else. */
export function HomePage() {
  return (
    <div className={s.page}>
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
