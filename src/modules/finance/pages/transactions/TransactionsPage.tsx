import { useState } from 'react'
import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { fetchTransactions, type PaginatedTransactions } from '@/modules/finance/api/transactions'
import { fetchCategories } from '@/modules/finance/api/categories'
import { useDebouncedValue } from '@/core/hooks/useDebouncedValue'
import { TransactionFilters as FiltersBar } from '@/modules/finance/components/transactions/TransactionFilters'
import { FilterDrawer } from '@/modules/finance/components/transactions/FilterDrawer'
import { TransactionToolbar } from '@/modules/finance/components/transactions/TransactionToolbar'
import {
  DEFAULT_FILTERS,
  toQuery,
  type TransactionFilterState,
} from '@/modules/finance/components/transactions/period'
import { TransactionList, TransactionListSkeleton } from '@/modules/finance/components/transactions/TransactionList'
import { staleClass } from '@/modules/finance/components/loading/stale'
import { useFinanceT } from '@/modules/finance/i18n'
import s from './TransactionsPage.module.scss'

export function TransactionsPage() {
  const t = useFinanceT()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [filters, setFilters] = useState<TransactionFilterState>(DEFAULT_FILTERS)

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
    isPlaceholderData,
  } = useInfiniteQuery<PaginatedTransactions>({
    queryKey: ['transactions', query],
    queryFn: ({ pageParam }) => fetchTransactions(query, pageParam as number, 20),
    getNextPageParam: (last) => last.hasMore ? last.page + 1 : undefined,
    initialPageParam: 1,
    // A new period, search or filter keeps the current list on screen
    // (dimmed) until the new one arrives, rather than flashing the skeleton.
    placeholderData: keepPreviousData,
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
        <TransactionListSkeleton />
      ) : (
        <div className={staleClass(isPlaceholderData)} aria-busy={isPlaceholderData || undefined}>
          {isPlaceholderData && <span className="sr-only">{t.tx.loadingList}</span>}
          <TransactionList
            transactions={transactions}
            // The old list's next page belongs to the old filters.
            hasMore={!!hasNextPage && !isPlaceholderData}
            isFetchingMore={isFetchingNextPage}
            onLoadMore={fetchNextPage}
            isFiltered={Object.values(query).some(Boolean)}
          />
        </div>
      )}

    </div>
  )
}
