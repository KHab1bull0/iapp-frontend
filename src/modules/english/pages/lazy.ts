import { lazy } from 'react'

export const VocabularyPage = lazy(() =>
  import('./vocabulary').then((m) => ({ default: m.VocabularyPage })),
)
export const StatsPage = lazy(() => import('./stats').then((m) => ({ default: m.StatsPage })))
export const ReviewPage = lazy(() => import('./review').then((m) => ({ default: m.ReviewPage })))
export const EnglishSettingsLayout = lazy(() =>
  import('./settings').then((m) => ({ default: m.EnglishSettingsLayout })),
)
export const EnglishSettingsIndex = lazy(() =>
  import('./settings').then((m) => ({ default: m.EnglishSettingsIndex })),
)
export const LevelsPage = lazy(() => import('./settings').then((m) => ({ default: m.LevelsPage })))
export const CategoriesPage = lazy(() =>
  import('./settings').then((m) => ({ default: m.CategoriesPage })),
)
export const WordFormPage = lazy(() => import('./form').then((m) => ({ default: m.WordFormPage })))
