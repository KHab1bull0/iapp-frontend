import type { ComponentType, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { RouteObject } from 'react-router-dom'
import type { Text } from '@/core/i18n'

/** A page of a module, shown in its sidebar group and its mobile tabs. */
export interface ModulePage {
  label: Text
  /** Absolute, e.g. '/finance/transactions'. */
  path: string
  icon: LucideIcon
  /** Match the path exactly (the module's overview page). */
  end?: boolean
}

/** An entry behind the floating "+" button. */
export interface QuickAddAction {
  id: string
  label: Text
  icon: LucideIcon
  to: string
}

/**
 * Everything the shell needs to know about a module. Navigation, routes, the
 * FAB, the mobile header, Settings and the home page all read MODULES; none of
 * them names a module.
 */
export interface ModuleManifest {
  /** Stable: used in URLs, the API prefix and (later) cross-module links. */
  id: string
  /** Shown in navigation; give both languages. */
  name: Text
  icon: LucideIcon
  /** Always '/' + id. */
  basePath: string
  pages: ModulePage[]
  /** Relative to basePath, rendered inside AppLayout. */
  routes: RouteObject[]
  /** Relative to basePath, rendered outside AppLayout (full-screen tasks). */
  fullscreenRoutes?: RouteObject[]
  /** Wraps the whole app, for state shared between this module's pages and the shell. */
  provider?: ComponentType<{ children: ReactNode }>
  homeCard?: ComponentType
  quickAdd?: QuickAddAction[]
  /** The module's own settings page, listed under Modules in Settings. */
  settingsPath?: string
}

export type BottomNavItem =
  | { kind: 'home' }
  | { kind: 'settings' }
  | { kind: 'menu' }
  | { kind: 'module'; module: ModuleManifest }

export type FabBehavior =
  | { kind: 'none' }
  | { kind: 'direct'; to: string; label: Text }
  | { kind: 'menu'; actions: QuickAddAction[] }
