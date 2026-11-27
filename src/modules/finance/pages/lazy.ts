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
export const FinanceSettingsLayout = lazy(() =>
  import('./settings').then((m) => ({ default: m.FinanceSettingsLayout })),
)
export const FinanceSettingsIndex = lazy(() =>
  import('./settings').then((m) => ({ default: m.FinanceSettingsIndex })),
)
export const CategoriesPage = lazy(() => import('./settings').then((m) => ({ default: m.CategoriesPage })))
export const CategoryFormPage = lazy(() =>
  import('./settings').then((m) => ({ default: m.CategoryFormPage })),
)
export const RatePage = lazy(() => import('./settings').then((m) => ({ default: m.RatePage })))
