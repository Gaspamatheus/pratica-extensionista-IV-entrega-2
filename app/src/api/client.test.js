import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, lerSessao, quandoSessaoExpirar, request, salvarSessao } from './client'

function respostaJson(status, corpo) {
  return Promise.resolve(
    new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } })
  )
}

describe('cliente da API', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => vi.unstubAllGlobals())

  it('envia o token JWT no cabeçalho Authorization', async () => {
    salvarSessao({ token: 'abc', usuario: { nome: 'Gerente' } })
    fetch.mockReturnValue(respostaJson(200, []))

    await request('/animais', { params: { status: 'ATIVO', busca: '' } })

    const [url, opcoes] = fetch.mock.calls[0]
    expect(url).toBe('/api/animais?status=ATIVO')
    expect(opcoes.headers.Authorization).toBe('Bearer abc')
  })

  it('transforma o erro da API em ApiError com a mensagem e os campos', async () => {
    fetch.mockReturnValue(
      respostaJson(400, { status: 400, mensagem: 'Dados inválidos', campos: { brinco: 'Informe o brinco' } })
    )

    const erro = await request('/animais', { method: 'POST', body: {} }).catch((e) => e)

    expect(erro).toBeInstanceOf(ApiError)
    expect(erro.status).toBe(400)
    expect(erro.message).toBe('Dados inválidos')
    expect(erro.campos.brinco).toBe('Informe o brinco')
  })

  it('apaga a sessão e avisa quando a API responde 401', async () => {
    salvarSessao({ token: 'vencido' })
    const aviso = vi.fn()
    quandoSessaoExpirar(aviso)
    fetch.mockReturnValue(respostaJson(401, { mensagem: 'Faça login para continuar' }))

    await expect(request('/animais')).rejects.toThrow('Faça login para continuar')
    expect(lerSessao()).toBeNull()
    expect(aviso).toHaveBeenCalled()
  })

  it('marca sem conexão quando o fetch falha', async () => {
    fetch.mockRejectedValue(new TypeError('Failed to fetch'))
    const erro = await request('/animais').catch((e) => e)
    expect(erro.semConexao).toBe(true)
  })

  it('descarta sessão com token vencido', () => {
    salvarSessao({ token: 'x', expiraEm: Date.now() - 1000 })
    expect(lerSessao()).toBeNull()
  })
})
