import { useQuery } from '@tanstack/react-query'
import type { Category } from '@/modules/finance/api/categories'
import { categoryParentsKey, fetchCategoryParents } from '@/modules/finance/api/categoryParents'
import { useCategoryName, useFinanceT } from '@/modules/finance/i18n'

/**
 * A category select's options: "all", then each parent (the whole of it, then
 * its categories), then the unassigned ones. Values as `categoryFilterValue`.
 */
export function CategoryOptions({ categories }: { categories: Category[] }) {
  const t = useFinanceT()
  const catName = useCategoryName()
  const { data: parents = [] } = useQuery({ queryKey: categoryParentsKey, queryFn: fetchCategoryParents })
  const known = new Set(parents.map((p) => p.id))
  const option = (c: Category) => (
    <option key={c.id} value={c.id}>
      {c.icon} {catName(c.name)}
    </option>
  )
  const loose = categories.filter((c) => !c.parentId || !known.has(c.parentId))

  return (
    <>
      <option value="all">{t.allCategories}</option>
      {parents.map((p) => {
        const children = categories.filter((c) => c.parentId === p.id)
        if (children.length === 0) return null
        return (
          <optgroup key={p.id} label={`${p.icon} ${p.name}`}>
            <option value={`p:${p.id}`}>{t.allOfParent(p.name)}</option>
            {children.map(option)}
          </optgroup>
        )
      })}
      {parents.length > 0 && loose.length > 0 ? (
        <optgroup label={t.categories.unassigned}>{loose.map(option)}</optgroup>
      ) : (
        loose.map(option)
      )}
    </>
  )
}
