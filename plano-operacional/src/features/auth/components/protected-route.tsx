import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/use-auth'
import type { Permission } from '../types'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermissions?: Permission[]
}

export function ProtectedRoute({
  children,
  requiredPermissions,
}: ProtectedRouteProps) {
  const { isAuthenticated, checkTokenExpiration, hasPermission } = useAuth()
  const location = useLocation()

  // Verificar se o token expirou
  const isTokenValid = checkTokenExpiration()

  if (!isAuthenticated || !isTokenValid) {
    // Redireciona para login preservando a URL de destino
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Verificar permissões se necessário
  if (requiredPermissions && requiredPermissions.length > 0) {
    if (!hasPermission(requiredPermissions)) {
      // Redireciona para página de acesso negado ou home
      return <Navigate to="/" replace />
    }
  }

  return <>{children}</>
}
