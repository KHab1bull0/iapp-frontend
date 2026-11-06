import { Keyboard, Plus } from 'lucide-react'
import { useText } from '@/core/i18n'
import { useCoreT } from '@/core/i18n/useCoreT'
import { activePage } from '@/core/modules/registry-utils'
import type { ModuleManifest } from '@/core/modules/types'
import { useQuickAdd } from '@/core/quickAdd/context'
import s from './DesktopTopBar.module.scss'

/**
 * Desktop only: where you are (module › page) and what you can do here — the
 * module's own Add, and the keyboard shortcuts. Phones show the page
 * switcher instead and add from the bottom bar.
 */
export function DesktopTopBar({
  module,
  pathname,
  onShortcuts,
}: {
  module: ModuleManifest
  pathname: string
  onShortcuts: () => void
}) {
  const t = useCoreT()
  const text = useText()
  const quickAdd = useQuickAdd()
  const page = activePage(module, pathname)
  const add = module.quickAdd?.[0]
  const ModuleIcon = module.icon

  return (
    <header className={s.bar}>
      <div className={s.inner}>
        <div className={s.where}>
          <span className={s.crumb}>
            <ModuleIcon size={15} aria-hidden /> {text(module.name)}
          </span>
          <h1 className={s.title}>{page ? text(page.label) : text(module.name)}</h1>
        </div>
        <div className={s.actions}>
          <button type="button" className={s.iconBtn} onClick={onShortcuts} aria-label={t.nav.shortcuts} title={`${t.nav.shortcuts} (?)`}>
            <Keyboard size={18} />
          </button>
          {add && (
            <button type="button" className={s.add} onClick={() => quickAdd.open(add.id)}>
              <Plus size={18} strokeWidth={2.5} aria-hidden />
              {text(add.label)}
              <kbd className={s.kbd}>N</kbd>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
