import { BarChart3, BookOpen, Languages, Layers } from 'lucide-react'
import type { ModuleManifest } from '@/core/modules/types'
import { EnglishHomeCard } from './EnglishHomeCard'
import {
  CategoriesPage,
  EnglishSettingsIndex,
  EnglishSettingsLayout,
  LevelsPage,
  ReviewPage,
  StatsPage,
  VocabularyPage,
  WordFormPage,
} from './pages/lazy'

export const english: ModuleManifest = {
  id: 'english',
  name: { uz: 'Ingliz tili', en: 'English' },
  icon: Languages,
  basePath: '/english',
  pages: [
    // Statistics first: opening English shows where the vocabulary stands.
    { label: { uz: 'Statistika', en: 'Statistics' }, path: '/english', icon: BarChart3, end: true },
    { label: { uz: 'Takrorlash', en: 'Review' }, path: '/english/review', icon: Layers },
    { label: { uz: "Lug'at", en: 'Vocabulary' }, path: '/english/vocabulary', icon: BookOpen },
  ],
  routes: [
    { index: true, element: <StatsPage /> },
    { path: 'review', element: <ReviewPage /> },
    { path: 'vocabulary', element: <VocabularyPage /> },
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
