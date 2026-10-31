import { useState } from 'react'
import clsx from 'clsx'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ChevronLeft, Plus } from 'lucide-react'
import { fetchCategories } from '@/modules/finance/api/categories'
import { AddCategoryDialog } from '@/modules/finance/components/categories/AddCategoryDialog'
import { CategoryList } from '@/modules/finance/components/categories/CategoryList'
// Shell styles, so the page looks like the app's other settings pages.
import { useFinanceT } from '@/modules/finance/i18n'
import s from '@/pages/settings/settings.module.scss'

type CatTab = 'expense' | 'income'

function CategoriesSkeleton() {
  return (
    <div className={s.catGrid}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={s.catCard} style={{ opacity: 0.5 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--border)' }} />
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
      {/* Opened from Settings → Modules, so that is where back leads. */}
      <Link to="/settings" className={s.backLink}>
        <ChevronLeft size={18} /> {t.settingsLink}
      </Link>
      <header className={s.pageHead}>
        <div>
          <h1 className={s.h1}>{t.categories.settingsTitle}</h1>
          <div className={s.pageSub}>{t.categories.settingsSub}</div>
        </div>
      </header>

      <div className={clsx(s.card, s.settingsCard)}>
        <div className={s.cardHead}>
          <h2 className={s.h3}>{t.categories.title}</h2>
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
