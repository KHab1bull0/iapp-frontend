import type { Category } from '@/modules/finance/api/categories'
import type { CategoryParent } from '@/modules/finance/api/categoryParents'
import { ListRow } from '@/core/components/ui/List'
import { EmptyState } from '@/core/components/ui/EmptyState'
import { useCategoryName, useFinanceT } from '@/modules/finance/i18n'
import s from './CategoryList.module.scss'

interface Props {
  categories: Category[]
  parents: CategoryParent[]
  type: 'income' | 'expense'
}

function Tile({ icon, color }: { icon: string; color: string }) {
  return (
    <span className={s.tile} style={{ background: `${color}22`, color }} aria-hidden>
      {icon}
    </span>
  )
}

/**
 * One type's categories: each parent a card, its categories under it; then
 * the unassigned ones in a card of their own. Every row opens its page.
 */
export function CategoryList({ categories, parents, type }: Props) {
  const t = useFinanceT()
  const catName = useCategoryName()
  const ofType = categories.filter((c) => c.type === type)
  const parentsOfType = parents.filter((p) => p.type === type)
  const known = new Set(parentsOfType.map((p) => p.id))
  const loose = ofType.filter((c) => !c.parentId || !known.has(c.parentId))

  if (ofType.length === 0 && parentsOfType.length === 0) {
    return <EmptyState compact title={t.categories.empty(t[type].toLowerCase())} />
  }

  const row = (c: Category) => (
    <ListRow
      key={c.id}
      to={`/finance/settings/categories/${c.id}/edit`}
      title={catName(c.name)}
      leading={<Tile icon={c.icon} color={c.color} />}
    />
  )

  return (
    <div className={s.groups}>
      {parentsOfType.map((p) => {
        const children = ofType.filter((c) => c.parentId === p.id)
        return (
          <section key={p.id} role="group" aria-label={p.name} className={s.card}>
            <div className={s.parent}>
              <ListRow
                to={`/finance/settings/parents/${p.id}/edit`}
                title={<span className={s.parentName}>{p.name}</span>}
                subtitle={t.categories.parentCount(children.length)}
                leading={<Tile icon={p.icon} color={p.color} />}
              />
            </div>
            {children.map((c) => (
              <div key={c.id} className={s.child}>
                {row(c)}
              </div>
            ))}
          </section>
        )
      })}

      {loose.length > 0 && (
        <section role="group" aria-label={t.categories.unassigned} className={s.looseGroup}>
          {parentsOfType.length > 0 && <h2 className={s.looseHead}>{t.categories.unassigned}</h2>}
          <div className={s.card}>{loose.map(row)}</div>
        </section>
      )}
    </div>
  )
}
