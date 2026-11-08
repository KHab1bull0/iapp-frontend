import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Sheet } from '@/core/components/ui/Sheet'
import { useIsMobile } from '@/core/hooks/useMediaQuery'
import { useText } from '@/core/i18n'
import { useCoreT } from '@/core/i18n/useCoreT'
import { activeModule, quickAddActions } from '@/core/modules/registry-utils'
import type { ModuleManifest } from '@/core/modules/types'
import { QuickAddContext } from './context'
import { isDialogOpen, isTyping } from '@/core/lib/dom'
import s from './QuickAdd.module.scss'

/**
 * Owns "+": the chooser (what to add), then the module's add page on phones
 * or its add panel on desktop. Everything that adds goes through here, so it
 * behaves the same from the bottom bar, the sidebar, the top bar, ⌘K, N, a
 * home card or an empty state.
 */
export function QuickAddProvider({ modules, children }: { modules: ModuleManifest[]; children: ReactNode }) {
  const t = useCoreT()
  const text = useText()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [chooserOpen, setChooserOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  const actions = quickAddActions(modules, activeModule(modules, pathname))
  const all = useMemo(() => quickAddActions(modules), [modules])

  const open = useCallback(
    (actionId?: string) => {
      // Phones go to the add page; desktop opens the editor over this page.
      const go = (id: string) => {
        const action = all.find((a) => a.id === id)
        if (!action) return
        if (isMobile || !action.Editor) navigate(action.to)
        else setActiveId(id)
      }
      if (actionId) {
        setChooserOpen(false)
        go(actionId)
      } else if (all.length === 1) {
        go(all[0].id)
      } else {
        setChooserOpen(true)
      }
    },
    [all, navigate, isMobile],
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

      {!isMobile &&
        all.map(({ id, Editor }) =>
          Editor ? <Editor key={id} open={activeId === id} onOpenChange={(o) => setActiveId(o ? id : null)} /> : null,
        )}
    </QuickAddContext.Provider>
  )
}
