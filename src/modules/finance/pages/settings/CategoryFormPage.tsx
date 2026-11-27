import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { fetchCategories } from '@/modules/finance/api/categories'
import { CategoryForm } from '@/modules/finance/components/categories/CategoryForm'
import { LoadingBlock } from '@/modules/finance/components/loading/Loading'
import { Skeleton } from '@/core/components/ui/Skeleton'
import { useFinanceT } from '@/modules/finance/i18n'
// The same full-screen shell as adding a transaction.
import s from '../transactions/TransactionFormPage.module.scss'

/**
 * Add/edit a category on a phone: a page of its own, no app chrome; its back
 * button is the way out. Desktop opens the dialog instead.
 */
export function CategoryFormPage() {
  const t = useFinanceT()
  const { id } = useParams<{ id: string }>()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const initialType = params.get('type') === 'income' ? 'income' : 'expense'

  const { data: categories, isLoading } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories })
  const category = isEdit ? categories?.find((c) => c.id === id) : null

  // Back to wherever it was opened from (the categories list).
  const close = () =>
    (window.history.state?.idx ?? 0) > 0 ? navigate(-1) : navigate('/finance/settings/categories')

  return (
    <div className={s.page}>
      <header className={s.head}>
        <button className={s.backBtn} onClick={close} aria-label={t.categories.back}>
          <ArrowLeft size={20} />
        </button>
        <h1 className={s.h1}>{isEdit ? t.categories.editTitle : t.categories.addTitle}</h1>
      </header>

      <div className={s.body}>
        <div className={s.inner}>
          {isEdit && isLoading ? (
            <LoadingBlock label={t.categories.loading}>
              <Skeleton width={72} height={72} radius="20px" />
            </LoadingBlock>
          ) : isEdit && !category ? (
            <div className={s.state}>
              <div className={s.stateTitle}>{t.categories.notFound}</div>
              <button className={s.btnSecondary} onClick={close}>
                {t.categories.back}
              </button>
            </div>
          ) : (
            <CategoryForm category={category} initialType={initialType} onSaved={close} onCancel={close} />
          )}
        </div>
      </div>
    </div>
  )
}
