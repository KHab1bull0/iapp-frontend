import { ModuleCardBoundary } from '@/core/components/ModuleCardBoundary'
import { MODULES } from '@/modules/registry'
import { useText } from '@/core/i18n'
import s from './HomePage.module.scss'

/** Every module's card, nothing else. */
export function HomePage() {
  const text = useText()
  return (
    <div className={s.page}>
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
