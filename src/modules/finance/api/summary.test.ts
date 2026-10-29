import { describe, expect, test } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { financeSummaryKey } from './summary'

describe('financeSummaryKey', () => {
  test('lives under the dashboard prefix the mutations already invalidate', () => {
    expect(financeSummaryKey('2026-10')).toEqual(['dashboard', 'summary', '2026-10'])
  })

  test('saving a transaction marks the home card stale', async () => {
    const qc = new QueryClient()
    qc.setQueryData(financeSummaryKey('2026-10'), { totalBalance: 1 })
    // What TransactionForm and TransactionList do after a save or delete.
    await qc.invalidateQueries({ queryKey: ['dashboard'] })
    expect(qc.getQueryState(financeSummaryKey('2026-10'))?.isInvalidated).toBe(true)
  })
})
