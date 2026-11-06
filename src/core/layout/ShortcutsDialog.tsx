import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/core/components/ui/dialog'
import { useCoreT } from '@/core/i18n/useCoreT'
import s from './ShortcutsDialog.module.scss'

/** "?" — every keyboard shortcut in one place. */
export function ShortcutsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useCoreT()
  const rows: [string[], string][] = [
    [['N'], t.keys.add],
    [['⌘', 'K'], t.keys.palette],
    [['/'], t.keys.search],
    [['['], t.keys.sidebar],
    [['?'], t.keys.help],
    [['Esc'], t.keys.close],
    [['Space', '1', '2'], t.keys.review],
  ]
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.nav.shortcuts}</DialogTitle>
        </DialogHeader>
        <dl className={s.list}>
          {rows.map(([keys, what]) => (
            <div key={what} className={s.row}>
              <dt className={s.keys}>
                {keys.map((k) => (
                  <kbd key={k} className={s.kbd}>
                    {k}
                  </kbd>
                ))}
              </dt>
              <dd className={s.what}>{what}</dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  )
}
