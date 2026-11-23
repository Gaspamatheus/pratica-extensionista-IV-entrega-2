import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/** Só deixa passar quem está logado; com somenteGerente, só o perfil GERENTE. */
export default function RotaProtegida({ somenteGerente = false }) {
  const { logado, gerente } = useAuth()
  const local = useLocation()
  if (!logado) return <Navigate to="/login" replace state={{ de: local.pathname }} />
  if (somenteGerente && !gerente) return <Navigate to="/animais" replace />
  return <Outlet />
}
