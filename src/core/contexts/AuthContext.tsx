import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { clearApiCache } from '@/core/lib/pwa'

interface AuthUser {
  id: string
  username: string
}

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function parseToken(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const isExpired = payload.exp * 1000 < Date.now()
    if (isExpired) return null
    return { id: payload.sub as string, username: payload.username as string }
  } catch {
    return null
  }
}

function loadStoredUser(): AuthUser | null {
  const token = localStorage.getItem('token')
  return token ? parseToken(token) : null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadStoredUser)

  const login = useCallback((token: string) => {
    const parsed = parseToken(token)
    if (parsed) {
      localStorage.setItem('token', token)
      setUser(parsed)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setUser(null)
    // The service worker caches API GETs so the app still renders offline.
    // Those responses outlive the token, so without this the next person to
    // sign in on the same phone could read the previous user's balances.
    void clearApiCache()
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: user !== null, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
