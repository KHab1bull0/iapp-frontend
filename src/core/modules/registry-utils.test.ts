import { describe, expect, test } from 'vitest'
import { Box } from 'lucide-react'
import type { ModuleManifest } from './types'
import {
  activeModule,
  bottomNavItems,
  quickAddActions,
  isModulePage,
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
    id: `${id}-${i}`,
    label: `New ${i}`,
    icon: Box,
    Editor: () => null,
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

describe('isModulePage', () => {
  const m: ModuleManifest = {
    ...fake('finance'),
    pages: [
      { label: 'Statistics', path: '/finance', icon: Box, end: true },
      { label: 'Transactions', path: '/finance/transactions', icon: Box },
    ],
  }

  test('true on a listed page and below a non-end page', () => {
    expect(isModulePage(m, '/finance')).toBe(true)
    expect(isModulePage(m, '/finance/transactions')).toBe(true)
    expect(isModulePage(m, '/finance/transactions/x')).toBe(true)
  })

  test('false on a route the module keeps out of its menu', () => {
    expect(isModulePage(m, '/finance/settings')).toBe(false)
  })
})

describe('bottomNavItems', () => {
  const kinds = (n: number, add = true) =>
    bottomNavItems(Array.from({ length: n }, (_, i) => (add ? withQuickAdd(`m${i}`, 1) : fake(`m${i}`)))).map((i) =>
      i.kind === 'module' ? i.module.id : i.kind,
    )

  test('puts "+" in the middle and shows every module when there are at most 3', () => {
    expect(kinds(1)).toEqual(['home', 'add', 'm0'])
    expect(kinds(2)).toEqual(['home', 'm0', 'add', 'm1'])
    expect(kinds(3)).toEqual(['home', 'm0', 'add', 'm1', 'm2'])
  })

  test('shows the first 2 and "More" when there are more than 3', () => {
    expect(kinds(4)).toEqual(['home', 'm0', 'add', 'm1', 'menu'])
  })

  test('has no "+" when nothing can be added', () => {
    expect(kinds(2, false)).toEqual(['home', 'm0', 'm1'])
  })
})

describe('quickAddActions', () => {
  test("lists the current module's actions first", () => {
    const a = withQuickAdd('a', 1)
    const b = withQuickAdd('b', 2)
    expect(quickAddActions([a, b]).map((x) => x.id)).toEqual(['a-0', 'b-0', 'b-1'])
    expect(quickAddActions([a, b], b).map((x) => x.id)).toEqual(['b-0', 'b-1', 'a-0'])
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
