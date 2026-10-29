import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/core/contexts/AuthContext'

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Outlet /> : <Navigate to="/auth" replace />
}
