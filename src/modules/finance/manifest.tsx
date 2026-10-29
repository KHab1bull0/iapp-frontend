import { ArrowLeftRight, LayoutDashboard, Plus, Wallet } from 'lucide-react'
import type { ModuleManifest } from '@/core/modules/types'
import { MobileFilterProvider } from './MobileFilterContext'
import { FinanceHeaderAction } from './FinanceHeaderAction'
import { FinanceSettingsSection } from './FinanceSettingsSection'
import { FinanceHomeCard } from './FinanceHomeCard'
import { DashboardPage, TransactionFormPage, TransactionsPage } from './pages/lazy'

export const finance: ModuleManifest = {
  id: 'finance',
  name: 'Finance',
  icon: Wallet,
  basePath: '/finance',
  pages: [
    { label: 'Overview', path: '/finance', icon: LayoutDashboard, end: true },
    { label: 'Transactions', path: '/finance/transactions', icon: ArrowLeftRight },
  ],
  routes: [
    { index: true, element: <DashboardPage /> },
    { path: 'transactions', element: <TransactionsPage /> },
  ],
  // Touch-only full-screen add/edit; desktop opens the dialog instead.
  fullscreenRoutes: [
    { path: 'transactions/new', element: <TransactionFormPage /> },
    { path: 'transactions/:id/edit', element: <TransactionFormPage /> },
  ],
  provider: MobileFilterProvider,
  headerAction: FinanceHeaderAction,
  quickAdd: [
    { id: 'add-transaction', label: 'Add transaction', icon: Plus, to: '/finance/transactions/new' },
  ],
  homeCard: FinanceHomeCard,
  settingsSection: FinanceSettingsSection,
}
