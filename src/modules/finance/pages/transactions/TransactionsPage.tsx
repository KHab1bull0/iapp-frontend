import { useState } from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { Skeleton } from '@/core/components/ui/Skeleton'
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
import { TransactionList } from '@/modules/finance/components/transactions/TransactionList'
import { useFinanceT } from '@/modules/finance/i18n'
import s from './TransactionsPage.module.scss'

function ListSkeleton() {
  return (
    <div className={s.skeletons} aria-hidden>
      {[0, 1].map((g) => (
        <div key={g} className={s.dayGroup}>
          <Skeleton width={80} height={12} />
          <div className={s.skeletonCard}>
            {[0, 1, 2].map((i) => (
              <div key={i} className={s.skeletonRow}>
                <Skeleton width={42} height={42} radius={999} />
                <div className={s.skeletonText}>
                  <Skeleton width={`${50 + g * 15}%`} height={14} />
                  <Skeleton width="35%" height={12} />
                </div>
                <Skeleton width={64} height={14} />
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

    </div>
  )
}
