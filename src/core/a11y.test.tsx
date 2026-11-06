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
})
