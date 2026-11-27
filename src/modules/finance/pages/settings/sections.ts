import { DollarSign, Tags, type LucideIcon } from 'lucide-react'
import type { FinanceMessages } from '@/modules/finance/i18n'

export interface FinanceSettingsSection {
  label: string
  description: string
  to: string
  icon: LucideIcon
}

/** Finance settings, one page each — the same nested pattern as English and the app's Settings. */
export function settingsSections(t: FinanceMessages['settings']): FinanceSettingsSection[] {
  return [
    { label: t.categories, description: t.categoriesDesc, to: '/finance/settings/categories', icon: Tags },
    { label: t.rate, description: t.rateDesc, to: '/finance/settings/rate', icon: DollarSign },
  ]
}
