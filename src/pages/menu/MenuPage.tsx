import { Settings } from 'lucide-react'
import { MODULES } from '@/modules/registry'
import { ListGroup, ListRow } from '@/core/components/ui/List'
import { PageHeader } from '@/core/components/ui/PageHeader'
import { useText } from '@/core/i18n'
import { useCoreT } from '@/core/i18n/useCoreT'
import s from './MenuPage.module.scss'

/** "More": every module, for when the bottom bar has more modules than slots, and Settings. */
export function MenuPage() {
  const t = useCoreT()
  const text = useText()
  return (
    <div className={s.page}>
      <PageHeader title={t.nav.more} compactBar />
      <ListGroup title={t.menu.title}>
        {MODULES.map(({ id, name, icon, basePath }) => (
          <ListRow key={id} title={text(name)} icon={icon} to={basePath} />
        ))}
      </ListGroup>
      <ListGroup>
        <ListRow title={t.nav.settings} icon={Settings} to="/settings" />
      </ListGroup>
    </div>
  )
}
