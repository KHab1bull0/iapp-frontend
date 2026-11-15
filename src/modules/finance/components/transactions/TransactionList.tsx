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
import { ConfirmDialog } from '@/core/components/ui/ConfirmDialog'
import { useNavigate } from 'react-router-dom'
import { useIsMobile } from '@/core/hooks/useMediaQuery'
import { Skeleton } from '@/core/components/ui/Skeleton'
import { LoadingBlock, Spinner, TextSkeleton } from '@/modules/finance/components/loading/Loading'
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
  const swipe = useSwipe({ onLeft: () => { if (!deleting) setConfirming(true) } })

  async function handleDelete() {
    if (deleting) return
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
    <div className={clsx(s.swipeWrap, swipe.dx !== 0 && s.swiping, deleting && s.deleting)} aria-busy={deleting || undefined}>
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
        <button className={s.txMain} onClick={() => onEdit(tx)} disabled={deleting} aria-label={`${t.edit}: ${tx.note ?? catName(tx.category.name)}, ${amount}`}>
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
        <ConfirmDialog
          open={confirming}
          onOpenChange={setConfirming}
          trigger={
            <button className={s.txDel} disabled={deleting} aria-label={deleting ? t.deleting : t.delete}>
              {deleting ? <Spinner /> : <Trash2 size={16} />}
            </button>
          }
          title={t.tx.deleteTitle}
          description={<>{t.tx.deleteWhat(amount)} {t.tx.deleteDesc}</>}
          confirmLabel={t.delete}
          cancelLabel={t.cancel}
          onConfirm={handleDelete}
        />
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
            aria-busy={isFetchingMore || undefined}
            className={s.btnSecondary}
          >
            {isFetchingMore && <Spinner />}
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

// Title widths per placeholder row, so the rows don't read as one block.
const SKELETON_GROUPS = [[55, 40, 65], [45, 60, 50]]

/**
 * The list before it arrives: day groups of rows built from the real rows'
 * classes, so phones get the two-line rows and desktop the table columns,
 * each at the height the real one will have.
 */
export function TransactionListSkeleton() {
  const t = useFinanceT()
  return (
    <LoadingBlock label={t.tx.loadingList} className={s.groups}>
      {SKELETON_GROUPS.map((rows, g) => (
        <div key={g} className={s.dayGroup} aria-hidden>
          <div className={s.dayHead}>
            <span className={s.dayLabel}>
              <TextSkeleton width={72} />
            </span>
            <span className={s.dayTotal}>
              <TextSkeleton width={56} />
            </span>
          </div>
          <div className={clsx(s.card, s.txList)}>
            {rows.map((w, i) => (
              <div key={i} className={s.swipeWrap}>
                <div className={clsx(s.txRow, s.skeletonRow)}>
                  <div className={s.txMain}>
                    <Skeleton width="var(--tile-md)" height="var(--tile-md)" radius="var(--radius-pill)" />
                    <span className={s.txMeta}>
                      <span className={s.txTitle}>
                        <TextSkeleton width={`${w}%`} />
                      </span>
                      <span className={s.txSub}>
                        <TextSkeleton width="35%" />
                      </span>
                    </span>
                    <span className={s.colCategory}>
                      <TextSkeleton width={96} />
                    </span>
                    <span className={s.colTime}>
                      <TextSkeleton width={36} />
                    </span>
                    <span className={s.txAmt}>
                      <TextSkeleton width={72} />
                    </span>
                  </div>
                  {/* Where each row's bin button sits. */}
                  <span className={s.skeletonDel} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </LoadingBlock>
  )
}
