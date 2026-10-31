import { Info, ShieldCheck, SlidersHorizontal, UserRound, type LucideIcon } from 'lucide-react'
import type { ModuleManifest } from '@/core/modules/types'

export interface SettingsNavItem {
  label: string
  description: string
  to: string
  icon: LucideIcon
}

export interface SettingsNavGroup {
  title: string
  items: SettingsNavItem[]
}

/**
 * Settings is grouped: each module's own settings first (what is changed
 * most), then who you are (Account) and how the app behaves on this device
 * (App). Sign out is deliberately not an item here; it sits apart, below
 * every group.
 */
export function settingsNav(modules: ModuleManifest[]): SettingsNavGroup[] {
  const moduleItems = modules
    .filter((m) => m.settingsPath)
    .map((m) => ({
      label: m.name,
      description: `${m.name} module settings`,
      to: m.settingsPath!,
      icon: m.icon,
    }))

  return [
    ...(moduleItems.length ? [{ title: 'Modules', items: moduleItems }] : []),
    {
      title: 'Account',
      items: [
        { label: 'Profile', description: 'Name and account details', to: '/settings/profile', icon: UserRound },
        { label: 'Security', description: 'Password', to: '/settings/security', icon: ShieldCheck },
      ],
    },
    {
      title: 'App',
      items: [
        { label: 'Preferences', description: 'Theme and language', to: '/settings/preferences', icon: SlidersHorizontal },
        { label: 'About', description: 'Version and updates', to: '/settings/about', icon: Info },
      ],
    },
  ]
}
