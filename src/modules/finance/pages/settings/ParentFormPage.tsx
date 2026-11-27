import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { fetchCategories } from '@/modules/finance/api/categories'
import { categoryParentsKey, fetchCategoryParents } from '@/modules/finance/api/categoryParents'
import { ParentForm } from '@/modules/finance/components/categories/ParentForm'
import { LoadingBlock } from '@/modules/finance/components/loading/Loading'
import { Skeleton } from '@/core/components/ui/Skeleton'
import { useFinanceT } from '@/modules/finance/i18n'
// The same full-screen shell as adding a transaction.
import s from '../transactions/TransactionFormPage.module.scss'

/** Add/edit a parent category: a page of its own, no app chrome; its back button is the way out. */
export function ParentFormPage() {
  const t = useFinanceT()
  const { id } = useParams<{ id: string }>()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const initialType = params.get('type') === 'income' ? 'income' : 'expense'

  const { data: categories, isLoading: catsLoading } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories })
  const { data: parents, isLoading: parentsLoading } = useQuery({
    queryKey: categoryParentsKey,
    queryFn: fetchCategoryParents,
  })
  const parent = isEdit ? parents?.find((p) => p.id === id) : null

  const close = () =>
    (window.history.state?.idx ?? 0) > 0 ? navigate(-1) : navigate('/finance/settings/categories')

  return (
    <div className={s.page}>
      <header className={s.head}>
        <button className={s.backBtn} onClick={close} aria-label={t.categories.back}>
          <ArrowLeft size={20} />
        </button>
        <h1 className={s.h1}>{isEdit ? t.categories.parentEditTitle : t.categories.parentAddTitle}</h1>
      </header>

      <div className={s.body}>
        <div className={s.inner}>
          {catsLoading || parentsLoading ? (
            <LoadingBlock label={t.categories.loading}>
              <Skeleton width={72} height={72} radius="20px" />
            </LoadingBlock>
          ) : isEdit && !parent ? (
            <div className={s.state}>
              <div className={s.stateTitle}>{t.categories.parentNotFound}</div>
              <button className={s.btnSecondary} onClick={close}>
                {t.categories.back}
              </button>
            </div>
          ) : (
            <ParentForm
              parent={parent}
              categories={categories ?? []}
              initialType={initialType}
              onSaved={close}
              onCancel={close}
            />
          )}
        </div>
      </div>
    </div>
  )
}
