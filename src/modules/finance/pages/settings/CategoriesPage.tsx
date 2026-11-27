import clsx from 'clsx'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FolderPlus, Plus } from 'lucide-react'
import { fetchCategories } from '@/modules/finance/api/categories'
import { categoryParentsKey, fetchCategoryParents } from '@/modules/finance/api/categoryParents'
import { CategoryList } from '@/modules/finance/components/categories/CategoryList'
import { LoadingBlock, TextSkeleton } from '@/modules/finance/components/loading/Loading'
import { Skeleton } from '@/core/components/ui/Skeleton'
import { useFinanceT } from '@/modules/finance/i18n'
import list from '@/modules/finance/components/categories/CategoryList.module.scss'
import { FinanceSettingsSubpage } from './FinanceSettingsSubpage'
import s from './CategoriesPage.module.scss'

const SKELETON_NAMES = [96, 72, 112, 84]

/** The list before it arrives: one card of rows at their real height. */
function CategoriesSkeleton() {
  const t = useFinanceT()
  return (
    <LoadingBlock label={t.categories.loading} className={list.groups}>
      <div className={list.card} aria-hidden>
        {SKELETON_NAMES.map((w) => (
          <div key={w} className={s.skeletonRow}>
            <Skeleton width="var(--tile-md)" height="var(--tile-md)" radius="10px" />
            <TextSkeleton width={w} />
          </div>
        ))}
      </div>
    </LoadingBlock>
  )
}

/**
 * Finance settings → categories. Expense or income on top (kept in the URL,
 * so coming back from a category lands on the same tab); adding a category
 * or a parent; then the list, each row opening its own page.
 */
export function CategoriesPage() {
  const t = useFinanceT()
  const [params, setParams] = useSearchParams()
  const type = params.get('type') === 'income' ? 'income' : 'expense'

  const { data: categories, isLoading } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories })
  const { data: parents = [], isLoading: parentsLoading } = useQuery({
    queryKey: categoryParentsKey,
    queryFn: fetchCategoryParents,
  })

  return (
    <FinanceSettingsSubpage title={t.settings.categories} description={t.categories.settingsSub}>
      <div className={s.tabs} role="group" aria-label={t.tx.type}>
        {(['expense', 'income'] as const).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={type === v}
            className={clsx(s.tab, type === v && s.active)}
            onClick={() => setParams(v === 'income' ? { type: v } : {}, { replace: true })}
          >
            {t[v === 'expense' ? 'expenses' : 'income']}
          </button>
        ))}
      </div>

      <div className={s.adds}>
        <Link to={`/finance/settings/categories/new?type=${type}`} className={s.add} aria-label={t.categories.new}>
          <Plus size={16} aria-hidden /> {t.categories.addShort}
        </Link>
        <Link to={`/finance/settings/parents/new?type=${type}`} className={s.add} aria-label={t.categories.newParent}>
          <FolderPlus size={16} aria-hidden /> {t.categories.addParentShort}
        </Link>
      </div>

      {isLoading || parentsLoading ? (
        <CategoriesSkeleton />
      ) : (
        <CategoryList categories={categories ?? []} parents={parents} type={type} />
      )}
    </FinanceSettingsSubpage>
  )
}
