import { Navigate } from 'react-router-dom'
import { DEV_AUTH_DISABLED } from '../../config/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * ProtectedRoute component - guards routes that require authentication.
 *
 * During development, the DEV_AUTH_DISABLED flag bypasses this enforcement so
 * the app can be navigated freely while keeping the original auth code intact.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  if (DEV_AUTH_DISABLED) {
    return <>{children}</>
  }

  const token = localStorage.getItem('token')

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
