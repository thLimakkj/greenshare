import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <p role="status" className="p-8 text-center">Carregando…</p>
  if (!user) return <Navigate to="/entrar" replace state={{ from: location }} />
  return <Outlet />
}
