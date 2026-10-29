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
import s from './TransactionList.module.scss'

function formatDayLabel(dateStr: string) {
  const d = parseApiDate(dateStr)
  const today = new Date()
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
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
  const [deleting, setDeleting] = useState(false)
  const qc = useQueryClient()

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteTransaction(tx.id)
      await qc.invalidateQueries({ queryKey: ['transactions'] })
      await qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast('Transaction deleted', 'success')
    } catch {
      toast('Failed to delete', 'error')
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
        <div className={s.txTitle}>{tx.note ?? tx.category.name}</div>
        <div className={s.txSub}>
          {tx.note ? `${tx.category.name} · ` : ''}{tx.time ?? tx.createdAt?.slice(11, 16) ?? tx.date.slice(0, 10)}
        </div>
      </div>
      <div className={clsx(s.txAmt, tx.type === 'income' ? s.amtIn : s.amtOut)}>
        {formatSigned(tx.amount, tx.type)}
      </div>
      <div className={s.txActions}>
        <button
          className={s.txEdit}
          onClick={() => onEdit(tx)}
          aria-label="Edit"
        >
          <Pencil size={15} />
        </button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className={s.txDel} disabled={deleting} aria-label="Delete">
              <Trash2 size={15} />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {formatSigned(tx.amount, tx.type)} {CURRENCY} ({tx.type}).
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
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
  const [editing, setEditing] = useState<Transaction | null>(null)
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  // Touch layouts get a full page; desktop keeps the dialog.
  function openEdit(tx: Transaction) {
    if (isMobile) navigate(`/transactions/${tx.id}/edit`)
    else setEditing(tx)
  }

  if (transactions.length === 0) {
    return (
      <div className={s.emptyCard}>
        <div className={s.emptyGlyph}>
          <Wallet size={28} />
        </div>
        <div className={s.emptyTitle}>
          {isFiltered ? 'No matching transactions' : 'No transactions yet'}
        </div>
        <div className={s.emptySub}>
          {isFiltered
            ? 'Try adjusting or clearing your filters'
            : 'Add your first income or expense to get started'}
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
              <span className={s.dayLabel}>{formatDayLabel(date)}</span>
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
            {isFetchingMore ? 'Loading…' : 'Load more'}
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
