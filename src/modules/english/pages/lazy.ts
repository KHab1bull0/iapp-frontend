import { lazy } from 'react'

export const VocabularyPage = lazy(() =>
  import('./vocabulary').then((m) => ({ default: m.VocabularyPage })),
)
export const ReviewPage = lazy(() => import('./review').then((m) => ({ default: m.ReviewPage })))
export const EnglishSettingsPage = lazy(() =>
  import('./settings').then((m) => ({ default: m.EnglishSettingsPage })),
)
export const WordFormPage = lazy(() => import('./form').then((m) => ({ default: m.WordFormPage })))
