import { BookOpen, Languages, Layers } from 'lucide-react'
import type { ModuleManifest } from '@/core/modules/types'
import { EnglishHomeCard } from './EnglishHomeCard'
import { EnglishSettingsPage, ReviewPage, VocabularyPage, WordFormPage } from './pages/lazy'

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
    // Not in the menu: opened from Settings → Modules → English.
    { path: 'settings', element: <EnglishSettingsPage /> },
  ],
  // Touch-only full-screen add/edit; desktop opens the dialog instead.
  fullscreenRoutes: [
    { path: 'new', element: <WordFormPage /> },
    { path: ':id/edit', element: <WordFormPage /> },
  ],
  homeCard: EnglishHomeCard,
  settingsPath: '/english/settings',
}
