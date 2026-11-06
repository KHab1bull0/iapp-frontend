import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import { House, Settings } from 'lucide-react'
import { useText } from '@/core/i18n'
import { useCoreT } from '@/core/i18n/useCoreT'
import { quickAddActions } from '@/core/modules/registry-utils'
import type { ModuleManifest } from '@/core/modules/types'
import { useQuickAdd } from '@/core/quickAdd/context'
import s from './CommandPalette.module.scss'

/**
 * ⌘K / Ctrl+K: jump to any page or add anything, from the keyboard. The
 * desktop sidebar's search button opens it too.
 */
export function CommandPalette({
  modules,
  open,
  onOpenChange,
}: {
  modules: ModuleManifest[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useCoreT()
  const text = useText()
  const navigate = useNavigate()
  const quickAdd = useQuickAdd()
  const [search, setSearch] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onOpenChange])

  const run = (fn: () => void) => {
    onOpenChange(false)
    setSearch('')
    fn()
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label={t.palette.open}
      className={s.dialog}
      overlayClassName={s.overlay}
    >
      <Command.Input value={search} onValueChange={setSearch} placeholder={t.palette.placeholder} className={s.input} />
      <Command.List className={s.list}>
        <Command.Empty className={s.empty}>{t.palette.empty}</Command.Empty>

        <Command.Group heading={t.palette.create} className={s.group}>
          {quickAddActions(modules).map(({ id, label, icon: Icon }) => (
            <Command.Item key={id} value={`add ${text(label)}`} onSelect={() => run(() => quickAdd.open(id))} className={s.item}>
              <Icon size={18} aria-hidden />
              {text(label)}
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group heading={t.palette.go} className={s.group}>
          <Command.Item value={t.nav.today} onSelect={() => run(() => navigate('/'))} className={s.item}>
            <House size={18} aria-hidden />
            {t.nav.today}
          </Command.Item>
          {modules.flatMap((m) =>
            m.pages.map((p) => {
              const label = `${text(m.name)} · ${text(p.label)}`
              const Icon = p.icon
              return (
                <Command.Item key={p.path} value={label} onSelect={() => run(() => navigate(p.path))} className={s.item}>
                  <Icon size={18} aria-hidden />
                  {label}
                </Command.Item>
              )
            }),
          )}
          <Command.Item value={t.nav.settings} onSelect={() => run(() => navigate('/settings'))} className={s.item}>
            <Settings size={18} aria-hidden />
            {t.nav.settings}
          </Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  )
}
