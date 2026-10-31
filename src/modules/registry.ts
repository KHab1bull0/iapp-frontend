import type { ModuleManifest } from '@/core/modules/types'
import { finance } from './finance/manifest'
import { tasks } from './tasks/manifest'
import { english } from './english/manifest'

// Every module of IAPP, in navigation order. Adding a module = one entry here
// (see docs/adding-a-module.md).
export const MODULES: ModuleManifest[] = [tasks, english, finance]
