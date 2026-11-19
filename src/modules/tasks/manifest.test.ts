import { describe, expect, test } from 'vitest'
import { bottomNavItems } from '@/core/modules/registry-utils'
import { tasks } from './manifest'

describe('tasks module in the bottom bar', () => {
  test('Today sits in the middle: Home · Stats · Today · Tasks · gear', () => {
    const items = bottomNavItems([tasks], tasks).map((i) =>
      i.kind === 'page' ? i.page.path : i.kind === 'settings' ? 'gear' : i.kind,
    )
    expect(items).toEqual(['home', '/tasks/stats', '/tasks', '/tasks/all', 'gear'])
  })
})
