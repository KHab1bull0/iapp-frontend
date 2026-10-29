import { lazy } from 'react'

// Pages load on demand, so each module adds its own chunk instead of growing
// the bundle every installed PWA downloads first.
export const DashboardPage = lazy(() =>
  import('./statistics').then((m) => ({ default: m.DashboardPage })),
)
export const TransactionsPage = lazy(() =>
  import('./transactions').then((m) => ({ default: m.TransactionsPage })),
)
export const TransactionFormPage = lazy(() =>
  import('./transactions').then((m) => ({ default: m.TransactionFormPage })),
)
export const FinanceSettingsPage = lazy(() =>
  import('./settings').then((m) => ({ default: m.FinanceSettingsPage })),
)
