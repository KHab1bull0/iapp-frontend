import { BarChart3, CalendarCheck, CircleCheck, ListChecks, ListTodo } from 'lucide-react'
import type { ModuleManifest } from '@/core/modules/types'
import { TasksHomeCard } from './TasksHomeCard'
import { TaskDialog } from './components/TaskDialog'
import { useDueCount } from './useDueCount'
import { AllTasksPage, TaskFormPage, TaskStatsPage, TodayPage } from './pages/lazy'

export const tasks: ModuleManifest = {
  id: 'tasks',
  name: { uz: 'Vazifalar', en: 'Tasks' },
  icon: ListChecks,
  basePath: '/tasks',
  pages: [
    { label: { uz: 'Bugun', en: 'Today' }, path: '/tasks', icon: CalendarCheck, end: true, useBadge: useDueCount },
    { label: { uz: 'Barcha vazifalar', en: 'All tasks' }, path: '/tasks/all', icon: ListTodo },
    { label: { uz: 'Statistika', en: 'Statistics' }, path: '/tasks/stats', icon: BarChart3 },
  ],
  routes: [
    { index: true, element: <TodayPage /> },
    { path: 'all', element: <AllTasksPage /> },
    { path: 'stats', element: <TaskStatsPage /> },
  ],
  // Touch-only full-screen add/edit; desktop opens the dialog instead.
  fullscreenRoutes: [
    { path: 'new', element: <TaskFormPage /> },
    { path: ':id/edit', element: <TaskFormPage /> },
  ],
  homeCard: TasksHomeCard,
  quickAdd: [{ id: 'tasks.task', label: { uz: 'Vazifa', en: 'Task' }, icon: CircleCheck, Editor: TaskDialog }],
}
