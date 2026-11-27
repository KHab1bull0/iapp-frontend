import { useState } from 'react'
import clsx from 'clsx'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { fetchCategories } from '@/modules/finance/api/categories'
import { categoryParentsKey, fetchCategoryParents } from '@/modules/finance/api/categoryParents'
import { ParentDialog } from '@/modules/finance/components/categories/ParentDialog'
import { AddCategoryDialog } from '@/modules/finance/components/categories/AddCategoryDialog'
import { CategoryList } from '@/modules/finance/components/categories/CategoryList'
import { useFinanceT } from '@/modules/finance/i18n'
import rows from '@/modules/finance/components/categories/CategoryList.module.scss'
import { FinanceSettingsSubpage } from './FinanceSettingsSubpage'
import s from './CategoriesPage.module.scss'
import { Skeleton } from '@/core/components/ui/Skeleton'
import { LoadingBlock, TextSkeleton } from '@/modules/finance/components/loading/Loading'

type CatTab = 'expense' | 'income'

const SKELETON_NAMES = [96, 72, 112, 84]

/** The category rows before they arrive: the real row's four columns at its height. */
function CategoriesSkeleton() {
  const t = useFinanceT()
  return (
    <LoadingBlock label={t.categories.loading} className={rows.catGrid}>
      {SKELETON_NAMES.map((w) => (
        <div key={w} className={rows.catCard} aria-hidden>
          <Skeleton width="var(--tile-md)" height="var(--tile-md)" radius="var(--radius-sm)" />
          <div className={rows.catMeta}>
            <div className={rows.catName}>
              <TextSkeleton width={w} />
            </div>
            <div className={rows.catType}>
              <TextSkeleton width={48} />
            </div>
          </div>
          <Skeleton width="var(--control-sm)" height="var(--control-sm)" radius="var(--radius-sm)" />
          <Skeleton width="var(--control-sm)" height="var(--control-sm)" radius="var(--radius-sm)" />
        </div>
      ))}
    </LoadingBlock>
  )
}

/** Finance settings → categories: income and expense, and the parents that group them. */
export function CategoriesPage() {
  const t = useFinanceT()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [parentOpen, setParentOpen] = useState(false)
  const [catTab, setCatTab] = useState<CatTab>('expense')

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  })
  const { data: parents = [], isLoading: parentsLoading } = useQuery({
    queryKey: categoryParentsKey,
    queryFn: fetchCategoryParents,
  })

  return (
    <FinanceSettingsSubpage title={t.settings.categories} description={t.categories.settingsSub}>
      <div className={s.card}>
        <div className={s.cardHead}>
          <h2 className={s.title}>{t.categories.title}</h2>
          <div className={s.headActions}>
            <button className={s.btnSecondary} onClick={() => setParentOpen(true)}>
              <Plus size={14} /> {t.categories.newParent}
            </button>
            <button className={s.btnSecondary} onClick={() => setDialogOpen(true)}>
              <Plus size={14} /> {t.categories.new}
            </button>
          </div>
        </div>
        <div className={s.tabs}>
          <button
            className={clsx(s.tab, catTab === 'expense' && s.active)}
            onClick={() => setCatTab('expense')}
          >
            {t.expenses}
          </button>
          <button
            className={clsx(s.tab, catTab === 'income' && s.active)}
            onClick={() => setCatTab('income')}
          >
            {t.income}
          </button>
        </div>
        {isLoading || parentsLoading ? (
          <CategoriesSkeleton />
        ) : (
          <CategoryList categories={categories ?? []} parents={parents} type={catTab} />
        )}
      </div>

      <AddCategoryDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <ParentDialog open={parentOpen} onOpenChange={setParentOpen} type={catTab} categories={categories ?? []} />
    </FinanceSettingsSubpage>
  )
}
