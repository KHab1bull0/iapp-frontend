import { BookOpen, Languages, Layers } from 'lucide-react'
import type { ModuleManifest } from '@/core/modules/types'
import { EnglishHomeCard } from './EnglishHomeCard'
import {
  CategoriesPage,
  EnglishSettingsIndex,
  EnglishSettingsLayout,
  LevelsPage,
  ReviewPage,
  VocabularyPage,
  WordFormPage,
} from './pages/lazy'

export const english: ModuleManifest = {
  id: 'english',
  name: 'English',
  icon: Languages,
  basePath: '/english',
  pages: [
    { label: 'Vocabulary', path: '/english', icon: BookOpen, end: true },
    { label: 'Review', path: '/english/review', icon: Layers },
  ],
  routes: [
    { index: true, element: <VocabularyPage /> },
    { path: 'review', element: <ReviewPage /> },
    // Not in the menu: opened from Settings → Modules → English. Nested like
    // the app's Settings: a section list, then one page per section.
    {
      path: 'settings',
      element: <EnglishSettingsLayout />,
      children: [
        { index: true, element: <EnglishSettingsIndex /> },
        { path: 'levels', element: <LevelsPage /> },
        { path: 'categories', element: <CategoriesPage /> },
      ],
    },
  ],
  // Touch-only full-screen add/edit; desktop opens the dialog instead.
  fullscreenRoutes: [
    { path: 'new', element: <WordFormPage /> },
    { path: ':id/edit', element: <WordFormPage /> },
  ],
  homeCard: EnglishHomeCard,
  settingsPath: '/english/settings',
}
