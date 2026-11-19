import { describe, expect, test } from 'vitest'
import { Box } from 'lucide-react'
import type { ModuleManifest } from './types'
import {
  activeModule,
  bottomNavItems,
  quickAddActions,
  activePage,
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
    to: `/${id}/new-${i}`,
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

describe('activePage', () => {
  const m: ModuleManifest = {
    ...fake('tasks'),
    pages: [
      { label: 'Today', path: '/tasks', icon: Box, end: true },
      { label: 'All', path: '/tasks/all', icon: Box },
    ],
  }

  test('finds the page, longest path first', () => {
    expect(activePage(m, '/tasks')?.label).toBe('Today')
    expect(activePage(m, '/tasks/all')?.label).toBe('All')
    expect(activePage(m, '/tasks/other')).toBeUndefined()
  })
})

describe('bottomNavItems', () => {
  const kinds = (n: number) =>
    bottomNavItems(Array.from({ length: n }, (_, i) => withQuickAdd(`m${i}`, 1))).map((i) =>
      i.kind === 'module' ? i.module.id : i.kind,
    )

  test('shows Home and every module when there are at most 4 ("+" floats apart)', () => {
    expect(kinds(1)).toEqual(['home', 'm0'])
    expect(kinds(4)).toEqual(['home', 'm0', 'm1', 'm2', 'm3'])
  })

  test('shows the first 3 and "More" when there are more than 4', () => {
    expect(kinds(5)).toEqual(['home', 'm0', 'm1', 'm2', 'menu'])
  })

  const page = (path: string) => ({ label: path, path, icon: Box })
  const inside = (m: ModuleManifest) =>
    bottomNavItems([m, withQuickAdd('other', 1)], m).map((i) =>
      i.kind === 'page' ? i.page.path : i.kind === 'settings' ? `gear ${i.path}` : i.kind,
    )

  test('inside a module: Home and its pages, with its gear when a slot is left', () => {
    const three = { ...fake('en'), pages: [page('/en'), page('/en/review'), page('/en/words')], settingsPath: '/en/settings' }
    expect(inside(three)).toEqual(['home', '/en', '/en/review', '/en/words', 'gear /en/settings'])
    const four = { ...three, pages: [...three.pages, page('/en/x')] }
    expect(inside(four)).toEqual(['home', '/en', '/en/review', '/en/words', '/en/x'])
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
