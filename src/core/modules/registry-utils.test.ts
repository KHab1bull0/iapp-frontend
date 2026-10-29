import { describe, expect, test } from 'vitest'
import { Box } from 'lucide-react'
import type { ModuleManifest } from './types'
import {
  activeModule,
  bottomNavItems,
  fabBehavior,
  legacyRedirect,
  validateRegistry,
} from './registry-utils'

const fake = (id: string): ModuleManifest => ({
  id,
  name: id,
  icon: Box,
  basePath: `/${id}`,
  pages: [],
  routes: [],
})

const withQuickAdd = (id: string, n: number): ModuleManifest => ({
  ...fake(id),
  quickAdd: Array.from({ length: n }, (_, i) => ({
    id: `new-${i}`,
    label: `New ${i}`,
    icon: Box,
    to: `/${id}/new-${i}`,
  })),
})

describe('validateRegistry', () => {
  test('rejects duplicate ids, bad ids, reserved ids and basePath mismatch', () => {
    expect(() => validateRegistry([fake('a'), fake('a')])).toThrow(/duplicate/i)
    expect(() => validateRegistry([fake('Bad')])).toThrow(/id/i)
    expect(() => validateRegistry([fake('settings')])).toThrow(/reserved/i)
    expect(() => validateRegistry([{ ...fake('a'), basePath: '/b' }])).toThrow(/basePath/i)
  })

  test('accepts a valid registry', () => {
    expect(() => validateRegistry([fake('a'), fake('b-2')])).not.toThrow()
  })
})

describe('activeModule', () => {
  test('matches on path boundaries only', () => {
    const m = [fake('finance')]
    expect(activeModule(m, '/finance')?.id).toBe('finance')
    expect(activeModule(m, '/finance/transactions/x/edit')?.id).toBe('finance')
    expect(activeModule(m, '/financex')).toBeUndefined()
    expect(activeModule(m, '/')).toBeUndefined()
  })
})

describe('bottomNavItems', () => {
  const kinds = (n: number) =>
    bottomNavItems(Array.from({ length: n }, (_, i) => fake(`m${i}`))).map((i) =>
      i.kind === 'module' ? i.module.id : i.kind,
    )

  test('shows every module when there are at most 3', () => {
    expect(kinds(1)).toEqual(['home', 'm0', 'settings'])
    expect(kinds(3)).toEqual(['home', 'm0', 'm1', 'm2', 'settings'])
  })

  test('shows the first 2 and a menu when there are more than 3', () => {
    expect(kinds(4)).toEqual(['home', 'm0', 'm1', 'menu', 'settings'])
  })
})

describe('fabBehavior', () => {
  test('none without quick-add actions', () => {
    expect(fabBehavior([fake('a')])).toEqual({ kind: 'none' })
  })

  test('direct with exactly one action', () => {
    expect(fabBehavior([withQuickAdd('a', 1)])).toMatchObject({ kind: 'direct', to: '/a/new-0' })
  })

  test('menu with several actions across modules', () => {
    expect(fabBehavior([withQuickAdd('a', 1), withQuickAdd('b', 1)]).kind).toBe('menu')
  })
})

describe('legacyRedirect', () => {
  test('maps old transaction URLs, keeping ids and the query', () => {
    expect(legacyRedirect('/transactions', '?type=income')).toBe('/finance/transactions?type=income')
    expect(legacyRedirect('/transactions/new', '')).toBe('/finance/transactions/new')
    expect(legacyRedirect('/transactions/abc-123/edit', '?x=1')).toBe(
      '/finance/transactions/abc-123/edit?x=1',
    )
  })

  test('returns null for anything else', () => {
    expect(legacyRedirect('/finance/transactions', '')).toBeNull()
  })
})
