import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Sheet } from '@/core/components/ui/Sheet'
import { useText } from '@/core/i18n'
import { useCoreT } from '@/core/i18n/useCoreT'
import { activeModule, quickAddActions } from '@/core/modules/registry-utils'
import type { ModuleManifest } from '@/core/modules/types'
import { QuickAddContext } from './context'
import { isDialogOpen, isTyping } from '@/core/lib/dom'
import s from './QuickAdd.module.scss'

/**
 * Owns "+": the chooser sheet (what to add) and whichever module add sheet is
 * open. Everything that adds goes through here, so it looks and behaves the
 * same from the bottom bar, the sidebar, ⌘K, a home card or an empty state.
 */
export function QuickAddProvider({ modules, children }: { modules: ModuleManifest[]; children: ReactNode }) {
  const t = useCoreT()
  const text = useText()
  const { pathname } = useLocation()
  const [chooserOpen, setChooserOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  const actions = quickAddActions(modules, activeModule(modules, pathname))
  const all = useMemo(() => quickAddActions(modules), [modules])

  const open = useCallback(
    (actionId?: string) => {
      if (actionId) {
        setChooserOpen(false)
        setActiveId(actionId)
      } else if (all.length === 1) {
        setActiveId(all[0].id)
      } else {
        setChooserOpen(true)
      }
    },
    [all],
  )

  // "N" adds, as in most task and mail apps.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'n' || e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return
      if (isDialogOpen()) return
      e.preventDefault()
      open()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const value = useMemo(() => ({ open }), [open])

  return (
    <QuickAddContext.Provider value={value}>
      {children}

      <Sheet open={chooserOpen} onOpenChange={setChooserOpen} title={t.nav.add}>
        <div className={s.grid}>
          {actions.map(({ id, label, icon: Icon }, i) => (
            <button
              key={id}
              type="button"
              className={i === 0 ? `${s.tile} ${s.first}` : s.tile}
              onClick={() => open(id)}
            >
              <span className={s.icon} aria-hidden>
                <Icon size={22} />
              </span>
              {text(label)}
            </button>
          ))}
        </div>
      </Sheet>

      {all.map(({ id, Editor }) => (
        <Editor key={id} open={activeId === id} onOpenChange={(o) => setActiveId(o ? id : null)} />
      ))}
    </QuickAddContext.Provider>
  )
}
