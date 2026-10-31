import { Layers, Tags, type LucideIcon } from 'lucide-react'
import type { EnglishMessages } from '@/modules/english/i18n'

export interface EnglishSettingsSection {
  label: string
  description: string
  to: string
  icon: LucideIcon
}

/** English settings, one page each — the same nested pattern as the app's Settings. */
export function settingsSections(t: EnglishMessages['settings']): EnglishSettingsSection[] {
  return [
    { label: t.levels, description: t.levelsDesc, to: '/english/settings/levels', icon: Layers },
    { label: t.categories, description: t.categoriesDesc, to: '/english/settings/categories', icon: Tags },
  ]
}
