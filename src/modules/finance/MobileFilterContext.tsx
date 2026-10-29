import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface MobileFilterCtx {
  filterOpen: (() => void) | null
  setFilterOpen: (fn: (() => void) | null) => void
}

const Ctx = createContext<MobileFilterCtx>({ filterOpen: null, setFilterOpen: () => {} })

export function MobileFilterProvider({ children }: { children: ReactNode }) {
  const [filterOpen, _set] = useState<(() => void) | null>(null)

  // Wrap fn in a thunk so React doesn't call it as a state updater
  const setFilterOpen = useCallback((fn: (() => void) | null) => {
    _set(fn ? () => fn : null)
  }, [])

  return <Ctx.Provider value={{ filterOpen, setFilterOpen }}>{children}</Ctx.Provider>
}

export const useMobileFilter = () => useContext(Ctx)
