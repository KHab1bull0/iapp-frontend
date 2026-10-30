import { CalendarCheck, ListChecks, ListTodo } from 'lucide-react'
import type { ModuleManifest } from '@/core/modules/types'
import { TasksHomeCard } from './TasksHomeCard'
import { AllTasksPage, TaskFormPage, TodayPage } from './pages/lazy'

export const tasks: ModuleManifest = {
  id: 'tasks',
  name: 'Tasks',
  icon: ListChecks,
  basePath: '/tasks',
  pages: [
    { label: 'Today', path: '/tasks', icon: CalendarCheck, end: true },
    { label: 'All tasks', path: '/tasks/all', icon: ListTodo },
  ],
  routes: [
    { index: true, element: <TodayPage /> },
    { path: 'all', element: <AllTasksPage /> },
  ],
  // Touch-only full-screen add/edit; desktop opens the dialog instead.
  fullscreenRoutes: [
    { path: 'new', element: <TaskFormPage /> },
    { path: ':id/edit', element: <TaskFormPage /> },
  ],
  homeCard: TasksHomeCard,
}
