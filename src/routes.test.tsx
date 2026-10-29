import { describe, expect, test } from 'vitest'
import { isValidElement } from 'react'
import { matchRoutes } from 'react-router-dom'
import { Box } from 'lucide-react'
import { AppLayout } from '@/core/layout/AppLayout'
import { LegacyRedirect } from '@/core/components/LegacyRedirect'
import type { ModuleManifest } from '@/core/modules/types'
import { finance } from '@/modules/finance/manifest'
import { buildRoutes } from './routes'

const elementTypes = (path: string, modules: ModuleManifest[]) =>
  (matchRoutes(buildRoutes(modules), path) ?? []).map(({ route }) =>
    isValidElement(route.element) ? route.element.type : null,
  )

describe('buildRoutes', () => {
  test('an old edit link reaches the redirect', () => {
    expect(elementTypes('/transactions/abc-123/edit', [finance])).toContain(LegacyRedirect)
  })

  test('the finance edit form is full-screen with the id', () => {
    const matches = matchRoutes(buildRoutes([finance]), '/finance/transactions/abc-123/edit')!
    expect(matches.at(-1)!.params.id).toBe('abc-123')
    expect(elementTypes('/finance/transactions/abc-123/edit', [finance])).not.toContain(AppLayout)
  })

  test('finance overview and list render inside the shell', () => {
    expect(elementTypes('/finance', [finance])).toContain(AppLayout)
    expect(elementTypes('/finance/transactions', [finance])).toContain(AppLayout)
  })

  test("a module with full-screen pages but no index route still opens inside the shell at its base path", () => {
    const notes: ModuleManifest = {
      id: 'notes',
      name: 'Notes',
      icon: Box,
      basePath: '/notes',
      pages: [{ label: 'All', path: '/notes/all', icon: Box }],
      routes: [{ path: 'all', element: <p>all</p> }],
      fullscreenRoutes: [{ path: 'new', element: <p>new</p> }],
    }
    expect(elementTypes('/notes', [notes])).toContain(AppLayout)
  })

  test('finance settings and every settings page render inside the shell', () => {
    for (const path of [
      '/finance/settings',
      '/settings',
      '/settings/profile',
      '/settings/security',
      '/settings/preferences',
      '/settings/about',
    ]) {
      expect(elementTypes(path, [finance]), path).toContain(AppLayout)
    }
  })
})
