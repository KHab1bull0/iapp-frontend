import { useState } from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, RefreshCw } from 'lucide-react'
import { fetchTransactions, type PaginatedTransactions } from '@/modules/finance/api/transactions'
import { fetchCategories } from '@/modules/finance/api/categories'
import { useIsMobile } from '@/core/hooks/useMediaQuery'
import { useDebouncedValue } from '@/core/hooks/useDebouncedValue'
import { AddTransactionDialog } from '@/modules/finance/components/transactions/AddTransactionDialog'
import { TransactionFilters as FiltersBar } from '@/modules/finance/components/transactions/TransactionFilters'
import { FilterDrawer } from '@/modules/finance/components/transactions/FilterDrawer'
import { TransactionToolbar } from '@/modules/finance/components/transactions/TransactionToolbar'
import {
  DEFAULT_FILTERS,
  toQuery,
  type TransactionFilterState,
} from '@/modules/finance/components/transactions/period'
import { TransactionList } from '@/modules/finance/components/transactions/TransactionList'
import { useFinanceT } from '@/modules/finance/i18n'
import s from './TransactionsPage.module.scss'

function ListSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {[0, 1].map((g) => (
        <div key={g} className={s.dayGroup}>
          <div className={s.dayHead}>
            <div style={{ height: 11, width: 60, background: 'var(--border)', borderRadius: 4 }} />
            <div style={{ height: 12, width: 50, background: 'var(--border)', borderRadius: 4 }} />
          </div>
          <div className={`${s.card} ${s.txList}`}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={s.txRow} style={{ opacity: 0.6 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--border)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ height: 14, width: 100 + g * 20, background: 'var(--border)', borderRadius: 4 }} />
                  <div style={{ height: 12, width: 70, background: 'var(--border)', borderRadius: 4 }} />
                </div>
                <div style={{ height: 14, width: 56, background: 'var(--border)', borderRadius: 4 }} />
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--border)' }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function TransactionsPage() {
  const t = useFinanceT()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [filters, setFilters] = useState<TransactionFilterState>(DEFAULT_FILTERS)
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  // Touch layouts get a full page; desktop keeps the dialog.
  function openAdd() {
    if (isMobile) navigate('/finance/transactions/new')
    else setDialogOpen(true)
  }

  // Search waits for typing to pause; the other filters apply at once.
  const search = useDebouncedValue(filters.search, 300)
  const query = toQuery({ ...filters, search })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  })

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<PaginatedTransactions>({
    queryKey: ['transactions', query],
    queryFn: ({ pageParam }) => fetchTransactions(query, pageParam as number, 20),
    getNextPageParam: (last) => last.hasMore ? last.page + 1 : undefined,
    initialPageParam: 1,
  })

  const transactions = data?.pages.flatMap((p) => p.data) ?? []

  return (
    <div className={s.page}>
      <div className={s.desktopOnly}>
        <FiltersBar filters={filters} onChange={setFilters} categories={categories} />
      </div>

      <TransactionToolbar
        filters={filters}
        onChange={setFilters}
        categories={categories}
        onOpenFilters={() => setDrawerOpen(true)}
      />

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={filters}
        onApply={setFilters}
        categories={categories}
      />

      {isError ? (
        <div className={s.emptyCard}>
          <div className={s.emptyTitle}>{t.tx.failedList}</div>
          <button className={s.btnSecondary} style={{ marginTop: 8 }} onClick={() => refetch()}>
            <RefreshCw size={14} /> {t.retry}
          </button>
        </div>
      ) : isLoading ? (
        <ListSkeleton />
      ) : (
        <TransactionList
          transactions={transactions}
          hasMore={!!hasNextPage}
          isFetchingMore={isFetchingNextPage}
          onLoadMore={fetchNextPage}
          isFiltered={Object.values(query).some(Boolean)}
        />
      )}

      <AddTransactionDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      {/* The only way to add: this page's own floating button, on every width.
          Phones get the full-screen form, desktop the dialog. */}
      <button className={s.fab} onClick={openAdd} aria-label={t.tx.add}>
        <Plus size={22} />
      </button>
    </div>
  )
}
