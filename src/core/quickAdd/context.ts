import { createContext, useContext } from 'react'

export interface QuickAdd {
  /** With an action id, open that module's add sheet; without, the chooser. */
  open: (actionId?: string) => void
}

export const QuickAddContext = createContext<QuickAdd>({ open: () => {} })

/** Open an add sheet from anywhere: an empty state's button, a home card. */
export function useQuickAdd(): QuickAdd {
  return useContext(QuickAddContext)
}
