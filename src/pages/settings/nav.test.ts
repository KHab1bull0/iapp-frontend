import { describe, expect, test } from 'vitest'
import { finance } from '@/modules/finance/manifest'
import { settingsNav } from './nav'

describe('settingsNav', () => {
  test('groups account, app and module settings', () => {
    const groups = settingsNav([finance]).map((g) => ({
      title: g.title,
      items: g.items.map((i) => `${i.label} ${i.to}`),
    }))
    // Modules first, then the rest in their usual order.
    expect(groups).toEqual([
      { title: 'Modules', items: ['Finance /finance/settings'] },
      { title: 'Account', items: ['Profile /settings/profile', 'Security /settings/security'] },
      { title: 'App', items: ['Preferences /settings/preferences', 'About /settings/about'] },
    ])
  })

  test('drops the Modules group when no module has settings', () => {
    const { settingsPath: _, ...bare } = finance
    void _
    expect(settingsNav([bare]).map((g) => g.title)).toEqual(['Account', 'App'])
  })
})
