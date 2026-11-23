import { request, salvarSessao } from './client'

// Nome do cache em que o service worker guarda as respostas da API (vite.config.js).
export const CACHE_API = 'api-dados'

/** Faz login e guarda o token. Devolve a sessão { token, usuario, expiraEm }. */
export async function login(username, senha) {
  const r = await request('/auth/login', {
    method: 'POST',
    body: { username, senha },
    auth: false
  })
  const sessao = {
    token: r.token,
    usuario: r.usuario,
    expiraEm: Date.now() + r.expiraEmSegundos * 1000
  }
  salvarSessao(sessao)
  return sessao
}

/**
 * Sai do app e apaga os dados do rebanho guardados para uso offline.
 * A fila de lançamentos NÃO é apagada: o que foi lançado no campo é enviado no próximo login.
 */
export function logout() {
  salvarSessao(null)
  if (typeof caches !== 'undefined') caches.delete(CACHE_API).catch(() => {})
}
