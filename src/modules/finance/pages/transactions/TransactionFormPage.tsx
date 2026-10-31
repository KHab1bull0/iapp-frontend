import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { fetchTransaction } from '@/modules/finance/api/transactions'
import { useIsMobile } from '@/core/hooks/useMediaQuery'
import { TransactionForm } from '@/modules/finance/components/transactions/TransactionForm'
import { useFinanceT } from '@/modules/finance/i18n'
import s from './TransactionFormPage.module.scss'

/**
 * Full-screen add/edit, used on touch layouts.
 *
 * Routed outside AppLayout, so it carries no app header and no bottom nav —
 * entering a transaction is a single task that owns the whole viewport, and
 * the nav would only offer ways to abandon it half-finished. Its own back
 * button is the way out.
 *
 * Desktop keeps the dialog, so if the viewport grows past the breakpoint while
 * this page is open we hand the user back to the list rather than leave them
 * on a route desktop never uses.
 */
export function TransactionFormPage() {
  const t = useFinanceT()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const isEdit = Boolean(id)

  useEffect(() => {
    if (!isMobile) navigate('/finance/transactions', { replace: true })
  }, [isMobile, navigate])

  const { data: transaction, isLoading, isError } = useQuery({
    queryKey: ['transaction', id],
    queryFn: () => fetchTransaction(id!),
    enabled: isEdit,
  })

  const close = () => navigate('/finance/transactions')

  return (
    <div className={s.page}>
      <header className={s.head}>
        <button className={s.backBtn} onClick={close} aria-label={t.tx.back}>
          <ArrowLeft size={20} />
        </button>
        <h1 className={s.h1}>{isEdit ? t.tx.editTitle : t.tx.addTitle}</h1>
      </header>

      <div className={s.body}>
        <div className={s.inner}>
          {isEdit && isLoading ? (
            <div className={s.state}>
              <div className={s.stateSub}>{t.loading}</div>
            </div>
          ) : isEdit && (isError || !transaction) ? (
            <div className={s.state}>
              <div className={s.stateTitle}>{t.tx.notFound}</div>
              <div className={s.stateSub}>{t.tx.notFoundSub}</div>
              <button className={s.btnSecondary} onClick={close}>{t.tx.back}</button>
            </div>
          ) : (
            <TransactionForm
              transaction={transaction ?? null}
              onSaved={close}
              onCancel={close}
            />
          )}
        </div>
      </div>
    </div>
  )
}
