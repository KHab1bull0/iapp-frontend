import type { BottomNavItem, FabBehavior, ModuleManifest } from './types'

const ID_PATTERN = /^[a-z][a-z0-9-]*$/

/** Top-level paths the shell owns; a module may not take them. */
const RESERVED_IDS = new Set(['home', 'settings', 'auth', 'menu'])

/** Bottom nav has five slots: Home, up to three modules, Settings. */
const MAX_BOTTOM_NAV_MODULES = 3

/** Throws on the first registry mistake, so it surfaces at startup rather than as a broken route. */
export function validateRegistry(modules: ModuleManifest[]): void {
  const seen = new Set<string>()
  for (const m of modules) {
    if (!ID_PATTERN.test(m.id)) throw new Error(`Module id "${m.id}" must match ${ID_PATTERN}`)
    if (RESERVED_IDS.has(m.id)) throw new Error(`Module id "${m.id}" is reserved by the shell`)
    if (seen.has(m.id)) throw new Error(`Duplicate module id "${m.id}"`)
    if (m.basePath !== `/${m.id}`) {
      throw new Error(`Module "${m.id}" basePath must be "/${m.id}", got "${m.basePath}"`)
    }
    seen.add(m.id)
  }
}

export function activeModule(modules: ModuleManifest[], pathname: string): ModuleManifest | undefined {
  return modules.find((m) => pathname === m.basePath || pathname.startsWith(`${m.basePath}/`))
}

export function bottomNavItems(modules: ModuleManifest[]): BottomNavItem[] {
  const shown =
    modules.length <= MAX_BOTTOM_NAV_MODULES ? modules : modules.slice(0, MAX_BOTTOM_NAV_MODULES - 1)
  return [
    { kind: 'home' },
    ...shown.map((module): BottomNavItem => ({ kind: 'module', module })),
    ...(shown.length < modules.length ? [{ kind: 'menu' } as const] : []),
    { kind: 'settings' },
  ]
}

export function fabBehavior(modules: ModuleManifest[]): FabBehavior {
  const actions = modules.flatMap((m) => m.quickAdd ?? [])
  if (actions.length === 0) return { kind: 'none' }
  if (actions.length === 1) return { kind: 'direct', to: actions[0].to, label: actions[0].label }
  return { kind: 'menu', actions }
}

// Pre-module URLs, still opened by installed PWAs and bookmarks. Remove once
// those have updated (docs/adding-a-module.md).
const LEGACY_ROUTES: [RegExp, (m: RegExpMatchArray) => string][] = [
  [/^\/transactions\/?$/, () => '/finance/transactions'],
  [/^\/transactions\/new\/?$/, () => '/finance/transactions/new'],
  [/^\/transactions\/([^/]+)\/edit\/?$/, (m) => `/finance/transactions/${m[1]}/edit`],
]

export function legacyRedirect(pathname: string, search: string): string | null {
  for (const [pattern, to] of LEGACY_ROUTES) {
    const match = pathname.match(pattern)
    if (match) return to(match) + search
  }
  return null
}
