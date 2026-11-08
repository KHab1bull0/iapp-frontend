import { useState } from 'react'
import clsx from 'clsx'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { BackButton } from '@/core/components/BackButton'
import { fetchCategories } from '@/modules/finance/api/categories'
import { AddCategoryDialog } from '@/modules/finance/components/categories/AddCategoryDialog'
import { CategoryList } from '@/modules/finance/components/categories/CategoryList'
import { useFinanceT } from '@/modules/finance/i18n'
// Shell styles (back link, page heading), so the page looks like the app's
// other settings pages; the column, card and rows are this module's own.
import shell from '@/pages/settings/settings.module.scss'
import rows from '@/modules/finance/components/categories/CategoryList.module.scss'
import s from './FinanceSettingsPage.module.scss'
import { Skeleton } from '@/core/components/ui/Skeleton'

type CatTab = 'expense' | 'income'

function CategoriesSkeleton() {
  return (
    <div className={rows.catGrid}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={rows.catCard} aria-hidden>
          <Skeleton width={36} height={36} radius={8} />
          <div className={s.skeletonText}>
            <Skeleton width={80} height={14} />
            <Skeleton width={50} height={12} />
          </div>
          <Skeleton width={32} height={32} radius={8} />
        </div>
      ))}
    </div>
  )
}

/** Finance → Settings: the module's own preferences, starting with categories. */
export function FinanceSettingsPage() {
  const t = useFinanceT()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [catTab, setCatTab] = useState<CatTab>('expense')

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  })

  return (
    <div className={s.page}>
      {/* Back to wherever it was opened from: the tabs' gear, or Settings → Modules. */}
      <BackButton fallback="/finance" className={shell.backLink} />
      <header className={shell.pageHead}>
        <div>
          <h1 className={shell.h1}>{t.categories.settingsTitle}</h1>
          <div className={shell.pageSub}>{t.categories.settingsSub}</div>
        </div>
      </header>

      <div className={s.card}>
        <div className={s.cardHead}>
          <h2 className={s.title}>{t.categories.title}</h2>
          <button className={s.btnSecondary} onClick={() => setDialogOpen(true)}>
            <Plus size={14} /> {t.categories.new}
          </button>
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
        {isLoading ? (
          <CategoriesSkeleton />
        ) : (
          <CategoryList categories={categories ?? []} type={catTab} />
        )}
      </div>

      <AddCategoryDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
