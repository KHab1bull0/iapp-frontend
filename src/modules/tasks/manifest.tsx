import { BarChart3, CalendarCheck, CircleCheck, ListChecks, ListTodo } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import type { ModuleManifest } from '@/core/modules/types'
import { TasksHomeCard } from './TasksHomeCard'
import { useDueCount } from './useDueCount'
import { AllTasksPage, TaskFormPage, TaskStatsPage, TodayPage } from './pages/lazy'
import { TaskDialog } from './components/TaskDialog'

export const tasks: ModuleManifest = {
  id: 'tasks',
  name: { uz: 'Vazifalar', en: 'Tasks' },
  icon: ListChecks,
  basePath: '/tasks',
  pages: [
    // Statistics first, as in Finance and English: opening a module shows where it stands.
    { label: { uz: 'Tahlil', en: 'Stats' }, path: '/tasks', icon: BarChart3, end: true },
    { label: { uz: 'Bugun', en: 'Today' }, path: '/tasks/today', icon: CalendarCheck, useBadge: useDueCount },
    { label: { uz: 'Vazifalar', en: 'Tasks' }, path: '/tasks/all', icon: ListTodo },
  ],
  routes: [
    { index: true, element: <TaskStatsPage /> },
    { path: 'today', element: <TodayPage /> },
    { path: 'all', element: <AllTasksPage /> },
    // Where Statistics used to be, for bookmarks.
    { path: 'stats', element: <Navigate to="/tasks" replace /> },
  ],
  // Phones add/edit on these pages; desktop opens the panel instead.
  fullscreenRoutes: [
    { path: 'new', element: <TaskFormPage /> },
    { path: ':id/edit', element: <TaskFormPage /> },
  ],
  homeCard: TasksHomeCard,
  quickAdd: [{ id: 'tasks.task', label: { uz: 'Vazifa', en: 'Task' }, icon: CircleCheck, to: '/tasks/new', Editor: TaskDialog }],
}
