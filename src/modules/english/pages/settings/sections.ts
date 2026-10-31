import { Layers, Tags, type LucideIcon } from 'lucide-react'

export interface EnglishSettingsSection {
  label: string
  description: string
  to: string
  icon: LucideIcon
}

/** English settings, one page each — the same nested pattern as the app's Settings. */
export const SECTIONS: EnglishSettingsSection[] = [
  { label: 'Levels', description: 'Review steps and their days', to: '/english/settings/levels', icon: Layers },
  { label: 'Categories', description: 'Optional groups for words', to: '/english/settings/categories', icon: Tags },
]
