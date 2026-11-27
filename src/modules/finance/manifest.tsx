import { ArrowLeftRight, ChartColumn, Receipt, Wallet } from 'lucide-react'
import type { ModuleManifest } from '@/core/modules/types'
import { FinanceHomeCard } from './FinanceHomeCard'
import { AddTransactionDialog } from './components/transactions/AddTransactionDialog'
import {
  CategoriesPage,
  CategoryFormPage,
  DashboardPage,
  FinanceSettingsIndex,
  FinanceSettingsLayout,
  ParentFormPage,
  RatePage,
  TransactionFormPage,
  TransactionsPage,
} from './pages/lazy'

export const finance: ModuleManifest = {
  id: 'finance',
  name: { uz: 'Moliya', en: 'Finance' },
  icon: Wallet,
  basePath: '/finance',
  pages: [
    { label: { uz: 'Tahlil', en: 'Stats' }, path: '/finance', icon: ChartColumn, end: true },
    { label: { uz: 'Tranzaksiyalar', en: 'Transactions' }, path: '/finance/transactions', icon: ArrowLeftRight, adds: true },
  ],
  routes: [
    { index: true, element: <DashboardPage /> },
    { path: 'transactions', element: <TransactionsPage /> },
    // Not in the menu: opened from Settings → Modules → Finance. Nested like
    // English and the app's Settings: a section list, then one page each.
    {
      path: 'settings',
      element: <FinanceSettingsLayout />,
      children: [
        { index: true, element: <FinanceSettingsIndex /> },
        { path: 'categories', element: <CategoriesPage /> },
        { path: 'rate', element: <RatePage /> },
      ],
    },
  ],
  // Touch-only full-screen add/edit; desktop opens the dialog instead.
  fullscreenRoutes: [
    { path: 'transactions/new', element: <TransactionFormPage /> },
    { path: 'transactions/:id/edit', element: <TransactionFormPage /> },
    { path: 'settings/categories/new', element: <CategoryFormPage /> },
    { path: 'settings/categories/:id/edit', element: <CategoryFormPage /> },
    { path: 'settings/parents/new', element: <ParentFormPage /> },
    { path: 'settings/parents/:id/edit', element: <ParentFormPage /> },
  ],
  homeCard: FinanceHomeCard,
  quickAdd: [
    { id: 'finance.transaction', label: { uz: 'Tranzaksiya', en: 'Transaction' }, icon: Receipt, to: '/finance/transactions/new', Editor: AddTransactionDialog },
  ],
  settingsPath: '/finance/settings',
}
