import { BarChart3, BookOpen, BookPlus, FileSpreadsheet, Languages, Layers } from 'lucide-react'
import type { ModuleManifest } from '@/core/modules/types'
import { Navigate } from 'react-router-dom'
import { EnglishHomeCard } from './EnglishHomeCard'
import { useReviewCount } from './useReviewCount'
import { WordDialog } from './components/WordDialog'
import {
  EnglishSettingsIndex,
  EnglishSettingsLayout,
  ImportPage,
  LevelsPage,
  ReviewPage,
  StatsPage,
  TagsPage,
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
    { label: { uz: 'Tahlil', en: 'Stats' }, path: '/english', icon: BarChart3, end: true },
    { label: { uz: 'Yodlash', en: 'Memorise' }, path: '/english/review', icon: Layers, useBadge: useReviewCount },
    { label: { uz: "Lug'at", en: 'Vocabulary' }, path: '/english/vocabulary', icon: BookOpen },
  ],
  routes: [
    { index: true, element: <StatsPage /> },
    { path: 'review', element: <ReviewPage /> },
    { path: 'vocabulary', element: <VocabularyPage /> },
    // Opened from Vocabulary: many words at once from an Excel file.
    { path: 'import', element: <ImportPage /> },
    // Not in the menu: opened from Settings → Modules → English. Nested like
    // the app's Settings: a section list, then one page per section.
    {
      path: 'settings',
      element: <EnglishSettingsLayout />,
      children: [
        { index: true, element: <EnglishSettingsIndex /> },
        { path: 'levels', element: <LevelsPage /> },
        { path: 'tags', element: <TagsPage /> },
        // Categories became tags.
        { path: 'categories', element: <Navigate to="/english/settings/tags" replace /> },
      ],
    },
  ],
  // Touch-only full-screen add/edit; desktop opens the dialog instead.
  fullscreenRoutes: [
    { path: 'new', element: <WordFormPage /> },
    { path: ':id/edit', element: <WordFormPage /> },
  ],
  homeCard: EnglishHomeCard,
  // "+" asks how: one word by hand, or many from an Excel file.
  quickAdd: [
    { id: 'english.word', label: { uz: "So'z", en: 'Word' }, icon: BookPlus, to: '/english/new', Editor: WordDialog },
    { id: 'english.import', label: { uz: "Excel'dan so'zlar", en: 'Words from Excel' }, icon: FileSpreadsheet, to: '/english/import' },
  ],
  settingsPath: '/english/settings',
}
