import { BarChart3, CalendarCheck, CircleCheck, ListChecks, ListTodo } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import type { ModuleManifest } from '@/core/modules/types'
import { TasksHomeCard } from './TasksHomeCard'
import { useDueCount } from './useDueCount'
import { AllTasksPage, ReviewPage, TaskFormPage, TaskStatsPage, TodayPage } from './pages/lazy'
import { TaskDialog } from './components/TaskDialog'

export const tasks: ModuleManifest = {
  id: 'tasks',
  name: { uz: 'Vazifalar', en: 'Tasks' },
  icon: ListChecks,
  basePath: '/tasks',
  pages: [
    // Today first and opened by default: the module is used mostly to tick things off.
    { label: { uz: 'Bugun', en: 'Today' }, path: '/tasks', icon: CalendarCheck, end: true, useBadge: useDueCount },
    { label: { uz: 'Tahlil', en: 'Stats' }, path: '/tasks/stats', icon: BarChart3 },
    { label: { uz: 'Vazifalar', en: 'Tasks' }, path: '/tasks/all', icon: ListTodo },
  ],
  routes: [
    { index: true, element: <TodayPage /> },
    { path: 'stats', element: <TaskStatsPage /> },
    // Where Today used to be: old bookmarks and the notifications' links.
    { path: 'today', element: <Navigate to="/tasks" replace /> },
    { path: 'all', element: <AllTasksPage /> },
    // Opened from Stats' entry card and the Sunday notification; not a tab of its own.
    { path: 'review', element: <ReviewPage /> },
  ],
  // Phones add/edit on these pages; desktop opens the panel instead.
  fullscreenRoutes: [
    { path: 'new', element: <TaskFormPage /> },
    { path: ':id/edit', element: <TaskFormPage /> },
  ],
  homeCard: TasksHomeCard,
  quickAdd: [{ id: 'tasks.task', label: { uz: 'Vazifa', en: 'Task' }, icon: CircleCheck, to: '/tasks/new', Editor: TaskDialog }],
}
