import { useState } from 'react'
import clsx from 'clsx'
import { useNavigate } from 'react-router-dom'
import { Pencil, Trash2, Wallet } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useIsMobile } from '@/core/hooks/useMediaQuery'
import { deleteTransaction, type Transaction } from '@/modules/finance/api/transactions'
import { formatSigned, formatDay, formatAmount, parseApiDate, CURRENCY } from '@/core/lib/format'
import { toast } from '@/core/components/ui/toast'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/core/components/ui/alert-dialog'
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
  const qc = useQueryClient()

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

  return (
    <div className={s.txRow}>
      <div
        className={s.txCat}
        style={{ background: tx.category.color + '22', color: tx.category.color }}
      >
        {tx.category.icon}
      </div>
      <div className={s.txMeta}>
        <div className={s.txTitle}>{tx.note ?? catName(tx.category.name)}</div>
        <div className={s.txSub}>
          {tx.note ? `${catName(tx.category.name)} · ` : ''}{tx.time ?? tx.createdAt?.slice(11, 16) ?? tx.date.slice(0, 10)}
        </div>
      </div>
      <div className={clsx(s.txAmt, tx.type === 'income' ? s.amtIn : s.amtOut)}>
        {formatSigned(tx.amount, tx.type)}
      </div>
      <div className={s.txActions}>
        <button
          className={s.txEdit}
          onClick={() => onEdit(tx)}
          aria-label={t.edit}
        >
          <Pencil size={15} />
        </button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className={s.txDel} disabled={deleting} aria-label={t.delete}>
              <Trash2 size={15} />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.tx.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {formatSigned(tx.amount, tx.type)} {CURRENCY} ({tx.type}).
              {t.tx.deleteDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
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
  const [editing, setEditing] = useState<Transaction | null>(null)
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  // Touch layouts get a full page; desktop keeps the dialog.
  function openEdit(tx: Transaction) {
    if (isMobile) navigate(`/finance/transactions/${tx.id}/edit`)
    else setEditing(tx)
  }

  if (transactions.length === 0) {
    return (
      <div className={s.emptyCard}>
        <div className={s.emptyGlyph}>
          <Wallet size={28} />
        </div>
        <div className={s.emptyTitle}>
          {isFiltered ? t.tx.noMatches : t.tx.empty}
        </div>
        <div className={s.emptySub}>
          {isFiltered
            ? t.tx.noMatchesSub
            : t.tx.emptySub}
        </div>
      </div>
    )
  }

  const groups = groupByDate(transactions)

  return (
    <>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {groups.map(([date, txs]) => {
        const dayTotal = txs.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0)
        return (
          <div key={date} className={s.dayGroup}>
            <div className={s.dayHead}>
              <span className={s.dayLabel}>{formatDayLabel(date, t)}</span>
              <span className={clsx(s.dayTotal, dayTotal >= 0 ? s.amtIn : s.amtOut)}>
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
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 4 }}>
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
