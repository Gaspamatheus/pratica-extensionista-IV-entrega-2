import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { lerSessao, quandoSessaoExpirar } from '../api/client'
import * as authApi from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(() => lerSessao())

  // Se a API responder 401 (token vencido), volta para o login.
  useEffect(() => {
    quandoSessaoExpirar(() => setSessao(null))
    return () => quandoSessaoExpirar(() => {})
  }, [])

  const entrar = useCallback(async (username, senha) => {
    const nova = await authApi.login(username, senha)
    setSessao(nova)
    return nova
  }, [])

  const sair = useCallback(() => {
    authApi.logout()
    setSessao(null)
  }, [])

  const valor = useMemo(
    () => ({
      usuario: sessao?.usuario ?? null,
      logado: Boolean(sessao?.token),
      gerente: sessao?.usuario?.role === 'GERENTE',
      entrar,
      sair
    }),
    [sessao, entrar, sair]
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}
