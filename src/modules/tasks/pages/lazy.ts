import { lazy } from 'react'

export const TodayPage = lazy(() => import('./today').then((m) => ({ default: m.TodayPage })))
export const AllTasksPage = lazy(() => import('./all').then((m) => ({ default: m.AllTasksPage })))
export const TaskFormPage = lazy(() => import('./form').then((m) => ({ default: m.TaskFormPage })))
