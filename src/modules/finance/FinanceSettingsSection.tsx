import { useState } from 'react'
import clsx from 'clsx'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { fetchCategories } from '@/modules/finance/api/categories'
import { AddCategoryDialog } from '@/modules/finance/components/categories/AddCategoryDialog'
import { CategoryList } from '@/modules/finance/components/categories/CategoryList'
// Shell styles, so the section looks like every other Settings card.
import s from '@/pages/settings/SettingsPage.module.scss'

type CatTab = 'expense' | 'income'

function CategoriesSkeleton() {
  return (
    <div className={s.catGrid}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={s.catCard} style={{ opacity: 0.5 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--border)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ height: 14, width: 80, background: 'var(--border)', borderRadius: 4 }} />
            <div style={{ height: 11, width: 50, background: 'var(--border)', borderRadius: 4 }} />
          </div>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--border)' }} />
        </div>
      ))}
    </div>
  )
}

/** Finance's block in Settings: managing income and expense categories. */
export function FinanceSettingsSection() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [catTab, setCatTab] = useState<CatTab>('expense')

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  })

  return (
    <>
      <div className={clsx(s.card, s.settingsCard)}>
        <div className={s.cardHead}>
          <h2 className={s.h3}>Categories</h2>
          <button className={s.btnSecondary} onClick={() => setDialogOpen(true)}>
            <Plus size={14} /> New category
          </button>
        </div>
        <div className={s.tabs}>
          <button
            className={clsx(s.tab, catTab === 'expense' && s.active)}
            onClick={() => setCatTab('expense')}
          >
            Expenses
          </button>
          <button
            className={clsx(s.tab, catTab === 'income' && s.active)}
            onClick={() => setCatTab('income')}
          >
            Income
          </button>
        </div>
        {isLoading ? (
          <CategoriesSkeleton />
        ) : (
          <CategoryList categories={categories ?? []} type={catTab} />
        )}
      </div>

      <AddCategoryDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  )
}
