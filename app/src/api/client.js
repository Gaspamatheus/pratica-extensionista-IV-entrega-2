// Cliente HTTP da API. Coloca o token JWT em toda requisição e transforma
// as respostas de erro da API ({ status, mensagem, campos }) em ApiError.

const BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')
const CHAVE_SESSAO = 'gado.sessao'

export class ApiError extends Error {
  constructor(status, mensagem, campos = {}) {
    super(mensagem)
    this.name = 'ApiError'
    this.status = status
    this.campos = campos
  }

  /** true quando a requisição nem chegou na API (sem internet ou API fora do ar). */
  get semConexao() {
    return this.status === 0
  }
}

// ---- sessão (token + usuário) guardada no navegador ----

export function lerSessao() {
  try {
    const bruto = localStorage.getItem(CHAVE_SESSAO)
    if (!bruto) return null
    const sessao = JSON.parse(bruto)
    if (sessao.expiraEm && Date.now() > sessao.expiraEm) {
      localStorage.removeItem(CHAVE_SESSAO)
      return null
    }
    return sessao
  } catch {
    return null
  }
}

export function salvarSessao(sessao) {
  try {
    if (sessao) localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao))
    else localStorage.removeItem(CHAVE_SESSAO)
  } catch {
    // navegação privada sem storage: o app funciona enquanto a aba estiver aberta
  }
}

// Quem quiser saber que o token expirou (o AuthContext) se registra aqui.
let aoExpirar = () => {}
export function quandoSessaoExpirar(fn) {
  aoExpirar = fn
}

export async function request(caminho, { method = 'GET', body, params, auth = true } = {}) {
  let url = BASE_URL + caminho
  if (params) {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.append(k, v)
    })
    const texto = qs.toString()
    if (texto) url += '?' + texto
  }

  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const sessao = auth ? lerSessao() : null
  if (sessao?.token) headers.Authorization = `Bearer ${sessao.token}`

  let resposta
  try {
    resposta = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    })
  } catch {
    throw new ApiError(0, 'Sem conexão com o servidor. Verifique a internet ou se a API está rodando.')
  }

  if (resposta.status === 204) return null

  const tipo = resposta.headers.get('content-type') || ''
  const dados = tipo.includes('application/json') ? await resposta.json().catch(() => null) : null

  if (!resposta.ok) {
    if (resposta.status === 401 && auth) {
      salvarSessao(null)
      aoExpirar()
    }
    const mensagem = dados?.mensagem || mensagemPadrao(resposta.status)
    throw new ApiError(resposta.status, mensagem, dados?.campos || {})
  }
  return dados
}

function mensagemPadrao(status) {
  if (status === 401) return 'Sessão expirada. Entre novamente.'
  if (status === 403) return 'Seu perfil não tem permissão para esta ação.'
  if (status === 404) return 'Registro não encontrado.'
  if (status >= 500) return 'Erro no servidor. Tente de novo em instantes.'
  return 'Não foi possível concluir a operação.'
}

export const api = {
  get: (caminho, params) => request(caminho, { params }),
  post: (caminho, body) => request(caminho, { method: 'POST', body }),
  put: (caminho, body) => request(caminho, { method: 'PUT', body }),
  del: (caminho) => request(caminho, { method: 'DELETE' })
}
