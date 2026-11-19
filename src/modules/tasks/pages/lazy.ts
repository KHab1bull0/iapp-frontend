import { lazy } from 'react'

export const TodayPage = lazy(() => import('./today').then((m) => ({ default: m.TodayPage })))
export const AllTasksPage = lazy(() => import('./all').then((m) => ({ default: m.AllTasksPage })))
export const TaskFormPage = lazy(() => import('./form').then((m) => ({ default: m.TaskFormPage })))
export const TaskStatsPage = lazy(() => import('./stats').then((m) => ({ default: m.TaskStatsPage })))
export const ReviewPage = lazy(() => import('./review').then((m) => ({ default: m.ReviewPage })))
export const TaskDetailPage = lazy(() => import('./detail').then((m) => ({ default: m.TaskDetailPage })))
export const TaskSettingsPage = lazy(() => import('./settings').then((m) => ({ default: m.TaskSettingsPage })))
