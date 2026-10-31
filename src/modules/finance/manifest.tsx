import { ArrowLeftRight, ChartColumn, Wallet } from 'lucide-react'
import type { ModuleManifest } from '@/core/modules/types'
import { FinanceHomeCard } from './FinanceHomeCard'
import {
  DashboardPage,
  FinanceSettingsPage,
  TransactionFormPage,
  TransactionsPage,
} from './pages/lazy'

export const finance: ModuleManifest = {
  id: 'finance',
  name: { uz: 'Moliya', en: 'Finance' },
  icon: Wallet,
  basePath: '/finance',
  pages: [
    { label: { uz: 'Statistika', en: 'Statistics' }, path: '/finance', icon: ChartColumn, end: true },
    { label: { uz: 'Tranzaksiyalar', en: 'Transactions' }, path: '/finance/transactions', icon: ArrowLeftRight },
  ],
  routes: [
    { index: true, element: <DashboardPage /> },
    { path: 'transactions', element: <TransactionsPage /> },
    // Not in the menu: opened from Settings → Modules → Finance.
    { path: 'settings', element: <FinanceSettingsPage /> },
  ],
  // Touch-only full-screen add/edit; desktop opens the dialog instead.
  fullscreenRoutes: [
    { path: 'transactions/new', element: <TransactionFormPage /> },
    { path: 'transactions/:id/edit', element: <TransactionFormPage /> },
  ],
  homeCard: FinanceHomeCard,
  settingsPath: '/finance/settings',
}
