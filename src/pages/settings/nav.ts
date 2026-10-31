import { Info, ShieldCheck, SlidersHorizontal, UserRound, type LucideIcon } from 'lucide-react'
import type { ModuleManifest } from '@/core/modules/types'
import { localize, type Lang } from '@/core/i18n'
import { coreMessages } from '@/core/i18n/messages'

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
export function settingsNav(modules: ModuleManifest[], lang: Lang): SettingsNavGroup[] {
  const t = coreMessages[lang].settings
  const moduleItems = modules
    .filter((m) => m.settingsPath)
    .map((m) => ({
      label: localize(m.name, lang),
      description: t.moduleSettings(localize(m.name, lang)),
      to: m.settingsPath!,
      icon: m.icon,
    }))

  return [
    ...(moduleItems.length ? [{ title: t.groups.modules, items: moduleItems }] : []),
    {
      title: t.groups.account,
      items: [
        { label: t.profile, description: t.profileDesc, to: '/settings/profile', icon: UserRound },
        { label: t.security, description: t.securityDesc, to: '/settings/security', icon: ShieldCheck },
      ],
    },
    {
      title: t.groups.app,
      items: [
        { label: t.preferences, description: t.preferencesDesc, to: '/settings/preferences', icon: SlidersHorizontal },
        { label: t.about, description: t.aboutDesc, to: '/settings/about', icon: Info },
      ],
    },
  ]
}
