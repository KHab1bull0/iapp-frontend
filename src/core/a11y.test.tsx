import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import axe from 'axe-core'
import { ThemeProvider } from '@/core/contexts/ThemeContext'
import { AuthProvider } from '@/core/contexts/AuthContext'
import { todayYmd } from '@/core/lib/format'
import { AppLayout } from '@/core/layout/AppLayout'
import { MODULES } from '@/modules/registry'
import { tasksKeys, type Task } from '@/modules/tasks/api/tasks'
import { TodayPage } from '@/modules/tasks/pages/today/TodayPage'
import { TransactionForm } from '@/modules/finance/components/transactions/TransactionForm'
import { NotificationsPage } from '@/pages/settings/NotificationsPage'
import { installFakePush, uninstallFakePush, UA } from '@/test/push'

// jsdom can't compute colours (contrast is covered by styles/contrast.test.ts)
// and the page-level landmark rules need the whole document.
const RULES_OFF = ['color-contrast', 'region', 'landmark-one-main', 'page-has-heading-one']

async function violations(container: HTMLElement) {
  const result = await axe.run(container, {
    rules: Object.fromEntries(RULES_OFF.map((id) => [id, { enabled: false }])),
  })
  return result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)
}

const task = (id: string): Task => ({
  id, title: id, note: null, dueDate: todayYmd(), dueTime: '09:00', repeatMode: 'none', repeatUnit: null,
  repeatEvery: null, repeatWeekdays: null, repeatMonthDay: null, completedAt: null, createdAt: '', updatedAt: '',
})

function withProviders(ui: React.ReactNode, qc = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } })) {
  return render(
    <ThemeProvider>
      <QueryClientProvider client={qc}>
        <AuthProvider>
          <MemoryRouter initialEntries={['/tasks']}>{ui}</MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>,
  )
}

vi.mock('@/modules/finance/api/categories', async (orig) => ({
  ...(await orig<object>()),
  fetchCategories: vi.fn().mockResolvedValue([
    { id: 'c1', name: 'Food & Dining', type: 'expense', icon: '🍔', color: '#ef4444' },
  ]),
}))

vi.mock('@/core/notifications/api', async (orig) => ({
  ...(await orig<object>()),
  fetchPublicKey: vi.fn().mockResolvedValue('BDxrGylovc0doQJluj-uAqzxpEHkJfyjVfondqgBadfog-sk7pdjyiIM6SHz6wFBAmN-6The2oDbxDIQbulnM8g'),
  fetchSettings: vi.fn().mockResolvedValue({
    tasksDigest: true, tasksDigestAt: '08:00', englishReminder: false, englishReminderAt: '20:00',
  }),
  fetchDevices: vi.fn().mockResolvedValue([
    { id: 'd1', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15', createdAt: '2026-11-01T08:00:00Z', lastSuccessAt: '2026-11-09T08:00:00Z' },
  ]),
}))

describe('accessibility (axe)', () => {
  test('the shell: sidebar, bottom bar, module tabs', async () => {
    const { container } = withProviders(
      <Routes>
        <Route path="*" element={<AppLayout modules={MODULES} />} />
      </Routes>,
    )
    expect(await violations(container)).toEqual([])
  })

  test('Tasks → Today with tasks, the quick-add bar and progress', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } })
    qc.setQueryData(tasksKeys.today(todayYmd()), {
      overdue: [],
      today: [task('Gym'), task('Read')],
      doneToday: [{ completionId: 'c', task: task('Walk') }],
    })
    const { container } = withProviders(<TodayPage />, qc)
    await screen.findByText('Gym')
    expect(await violations(container)).toEqual([])
  })

  test('the transaction form', async () => {
    const { container } = withProviders(<TransactionForm onSaved={() => {}} onCancel={() => {}} />)
    await screen.findByRole('radio', { name: /Food/ })
    expect(await violations(container)).toEqual([])
  })

  test('Settings → Notifications, switched on: switches, times, devices', async () => {
    installFakePush({ subscribed: true })
    try {
      const { container } = withProviders(<NotificationsPage />)
      await screen.findByRole('switch', { name: 'Morning task summary' })
      await screen.findByText('iPhone · Safari')
      expect(await violations(container)).toEqual([])
    } finally {
      uninstallFakePush()
    }
  })

  test('Settings → Notifications on an iPhone in Safari: the install steps', async () => {
    installFakePush({ ua: UA.iphone, supported: false })
    try {
      const { container } = withProviders(<NotificationsPage />)
      await screen.findByText('Add IAPP to your Home Screen first')
      expect(await violations(container)).toEqual([])
    } finally {
      uninstallFakePush()
    }
  })
})
