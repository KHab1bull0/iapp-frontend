import { useState } from 'react'
import clsx from 'clsx'
import { Plus, Trash2, Wallet } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { deleteTransaction, type Transaction } from '@/modules/finance/api/transactions'
import { formatSigned, formatDay, formatAmount, parseApiDate, CURRENCY } from '@/core/lib/format'
import { toast } from '@/core/components/ui/toast'
import { EmptyState } from '@/core/components/ui/EmptyState'
import { useSwipe } from '@/core/hooks/useSwipe'
import { useQuickAdd } from '@/core/quickAdd/context'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/core/components/ui/alert-dialog'
import { useNavigate } from 'react-router-dom'
import { useIsMobile } from '@/core/hooks/useMediaQuery'
import { AddTransactionDialog } from './AddTransactionDialog'
import { useCategoryName, useFinanceT } from '@/modules/finance/i18n'
import s from './TransactionList.module.scss'

function formatDayLabel(dateStr: string, words: { today: string; yesterday: string }) {
  const d = parseApiDate(dateStr)
  const today = new Date()
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return words.today
  if (d.toDateString() === yesterday.toDateString()) return words.yesterday
  return formatDay(dateStr)
}

function groupByDate(transactions: Transaction[]): [string, Transaction[]][] {
  const map = new Map<string, Transaction[]>()
  for (const tx of transactions) {
    const key = tx.date.slice(0, 10)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(tx)
  }
  return Array.from(map.entries())
}

function TransactionRow({ tx, onEdit }: { tx: Transaction; onEdit: (tx: Transaction) => void }) {
  const t = useFinanceT()
  const catName = useCategoryName()
  const [deleting, setDeleting] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const qc = useQueryClient()
  // Swipe left asks to delete; the bin button is the same without a gesture.
  const swipe = useSwipe({ onLeft: () => setConfirming(true) })

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteTransaction(tx.id)
      await qc.invalidateQueries({ queryKey: ['transactions'] })
      await qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast(t.tx.deleted, 'success')
    } catch {
      toast(t.tx.deleteFailed, 'error')
    } finally {
      setDeleting(false)
    }
  }

  const amount = `${formatSigned(tx.amount, tx.type)} ${CURRENCY}`
  const time = tx.time ?? tx.createdAt?.slice(11, 16) ?? ''

  return (
    <div className={clsx(s.swipeWrap, swipe.dx !== 0 && s.swiping)}>
      {swipe.dx < 0 && (
        <div className={clsx(s.under, swipe.armed && s.armed)} aria-hidden>
          <Trash2 size={20} />
        </div>
      )}
      <div
        className={s.txRow}
        style={swipe.dx ? { transform: `translateX(${swipe.dx}px)` } : undefined}
        {...swipe.handlers}
      >
        <button className={s.txMain} onClick={() => onEdit(tx)} aria-label={`${t.edit}: ${tx.note ?? catName(tx.category.name)}, ${amount}`}>
          <span className={s.txCat} style={{ background: `${tx.category.color}22`, color: tx.category.color }} aria-hidden>
            {tx.category.icon}
          </span>
          <span className={s.txMeta}>
            <span className={s.txTitle}>{tx.note ?? catName(tx.category.name)}</span>
            <span className={s.txSub}>
              {tx.note ? `${catName(tx.category.name)} · ` : ''}
              {time}
            </span>
          </span>
          {/* Desktop table columns; phones fold these into the line above. */}
          <span className={s.colCategory}>
            <span className={s.dot} style={{ background: tx.category.color }} aria-hidden />
            {catName(tx.category.name)}
          </span>
          <span className={s.colTime}>{time}</span>
          <span className={clsx(s.txAmt, tx.type === 'income' ? s.amtIn : s.amtOut)}>{formatSigned(tx.amount, tx.type)}</span>
        </button>
        <AlertDialog open={confirming} onOpenChange={setConfirming}>
          <AlertDialogTrigger asChild>
            <button className={s.txDel} disabled={deleting} aria-label={t.delete}>
              <Trash2 size={16} />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t.tx.deleteTitle}</AlertDialogTitle>
              <AlertDialogDescription>
                {t.tx.deleteWhat(amount)} {t.tx.deleteDesc}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {t.delete}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

interface Props {
  transactions: Transaction[]
  hasMore: boolean
  isFetchingMore: boolean
  onLoadMore: () => void
  /** Whether any filter is active — decides which empty state to show. */
  isFiltered: boolean
}

export function TransactionList({
  transactions, hasMore, isFetchingMore, onLoadMore, isFiltered,
}: Props) {
  const t = useFinanceT()
  const quickAdd = useQuickAdd()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [editing, setEditing] = useState<Transaction | null>(null)
  // Phones: the edit page; desktop: the panel over the list.
  const openEdit = (tx: Transaction) =>
    isMobile ? navigate(`/finance/transactions/${tx.id}/edit`) : setEditing(tx)

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title={isFiltered ? t.tx.noMatches : t.tx.empty}
        description={isFiltered ? t.tx.noMatchesSub : t.tx.emptySub}
        action={isFiltered ? undefined : { label: t.tx.add, icon: Plus, onClick: () => quickAdd.open('finance.transaction') }}
      />
    )
  }

  const groups = groupByDate(transactions)

  return (
    <>
    <div className={s.groups}>
      {groups.map(([date, txs]) => {
        const dayTotal = txs.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0)
        return (
          <div key={date} className={s.dayGroup}>
            <div className={s.dayHead}>
              <span className={s.dayLabel}>{formatDayLabel(date, t)}</span>
              <span className={clsx(s.dayTotal, dayTotal >= 0 ? s.amtIn : s.amtOut)} title={t.tx.dayTotal(formatAmount(Math.abs(dayTotal)))}>
                {dayTotal >= 0 ? '+' : '−'}{formatAmount(Math.abs(dayTotal))}
              </span>
            </div>
            <div className={clsx(s.card, s.txList)}>
              {txs.map((tx) => <TransactionRow key={tx.id} tx={tx} onEdit={openEdit} />)}
            </div>
          </div>
        )
      })}

      {hasMore && (
        <div className={s.loadMore}>
          <button
            onClick={onLoadMore}
            disabled={isFetchingMore}
            className={s.btnSecondary}
          >
            {isFetchingMore ? t.loading : t.tx.loadMore}
          </button>
        </div>
      )}
    </div>

    <AddTransactionDialog
      open={editing !== null}
      onOpenChange={(v) => { if (!v) setEditing(null) }}
      transaction={editing}
    />
    </>
  )
}
