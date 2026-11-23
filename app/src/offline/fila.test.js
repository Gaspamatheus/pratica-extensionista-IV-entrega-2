import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { abrirBanco, FILA } from './db'
import {
  descartar,
  enviarOuEnfileirar,
  listarFila,
  ouvirFila,
  pendentes,
  sincronizar,
  tentarDeNovo
} from './fila'

const json = (status, corpo) =>
  Promise.resolve(new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } }))
const semRede = () => Promise.reject(new TypeError('Failed to fetch'))

function ficarOffline(offline) {
  Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => !offline })
}

const pesagem = (animalId, pesoKg) => ['/pesagens', { animalId, data: '2026-11-20', pesoKg }, { tipo: 'pesagem' }]

describe('fila offline', () => {
  beforeEach(async () => {
    await (await abrirBanco()).clear(FILA)
    vi.stubGlobal('fetch', vi.fn())
    ficarOffline(false)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('com internet envia direto e não guarda nada', async () => {
    fetch.mockReturnValue(json(201, { id: 10 }))

    const r = await enviarOuEnfileirar(...pesagem(1, 350))

    expect(r).toEqual({ enfileirado: false, dados: { id: 10 } })
    expect(await pendentes()).toBe(0)
    const corpo = JSON.parse(fetch.mock.calls[0][1].body)
    expect(corpo.idCliente).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('sem internet guarda no IndexedDB sem chamar a API', async () => {
    ficarOffline(true)

    const r = await enviarOuEnfileirar(...pesagem(1, 350))

    expect(r.enfileirado).toBe(true)
    expect(fetch).not.toHaveBeenCalled()
    const [item] = await listarFila()
    expect(item).toMatchObject({ tipo: 'pesagem', animalId: 1, caminho: '/pesagens', erro: null })
    expect(item.corpo.pesoKg).toBe(350)
  })

  it('guarda na fila quando a rede cai no meio do envio', async () => {
    fetch.mockImplementation(semRede)
    const r = await enviarOuEnfileirar(...pesagem(1, 350))
    expect(r.enfileirado).toBe(true)
    expect(await pendentes()).toBe(1)
  })

  it('erro de validação não vai para a fila: o formulário mostra na hora', async () => {
    fetch.mockReturnValue(json(422, { mensagem: 'Animal não está ativo' }))
    await expect(enviarOuEnfileirar(...pesagem(1, 350))).rejects.toThrow('Animal não está ativo')
    expect(await pendentes()).toBe(0)
  })

  it('quando a rede volta, reenvia na ordem e mantém o mesmo idCliente', async () => {
    ficarOffline(true)
    const a = await enviarOuEnfileirar(...pesagem(1, 300))
    await new Promise((r) => setTimeout(r, 2))
    const b = await enviarOuEnfileirar(...pesagem(2, 400))

    ficarOffline(false)
    fetch.mockImplementation(() => json(201, {}))
    const r = await sincronizar()

    expect(r).toEqual({ enviados: 2, falhas: 0, restantes: 0 })
    const enviados = fetch.mock.calls.map(([, op]) => JSON.parse(op.body).idCliente)
    expect(enviados).toEqual([a.item.idCliente, b.item.idCliente])
    expect(await listarFila()).toHaveLength(0)
  })

  it('para no primeiro erro de conexão e deixa o resto para depois', async () => {
    ficarOffline(true)
    await enviarOuEnfileirar(...pesagem(1, 300))
    await new Promise((r) => setTimeout(r, 2))
    await enviarOuEnfileirar(...pesagem(2, 400))
    ficarOffline(false)
    fetch.mockReturnValueOnce(json(201, {})).mockImplementationOnce(semRede)

    const r = await sincronizar()

    expect(r).toEqual({ enviados: 1, falhas: 0, restantes: 1 })
    const [restante] = await listarFila()
    expect(restante.animalId).toBe(2)
    expect(restante.tentativas).toBe(1)
  })

  it('item recusado pela API vira falha e não trava os outros', async () => {
    ficarOffline(true)
    await enviarOuEnfileirar(...pesagem(1, 300))
    await new Promise((r) => setTimeout(r, 2))
    await enviarOuEnfileirar(...pesagem(2, 400))
    ficarOffline(false)
    fetch
      .mockReturnValueOnce(json(422, { mensagem: 'O animal BR-001 já foi vendido' }))
      .mockReturnValueOnce(json(201, {}))

    const r = await sincronizar()

    expect(r).toEqual({ enviados: 1, falhas: 1, restantes: 0 })
    const [falha] = await listarFila()
    expect(falha.erro).toEqual({ status: 422, mensagem: 'O animal BR-001 já foi vendido' })
    expect(await pendentes()).toBe(0)

    // depois de corrigir no servidor, dá para tentar de novo
    fetch.mockReturnValueOnce(json(201, {}))
    await tentarDeNovo(falha.idCliente)
    expect(await listarFila()).toHaveLength(0)
  })

  it('sessão expirada (401) mantém os itens para depois do login', async () => {
    ficarOffline(true)
    await enviarOuEnfileirar(...pesagem(1, 300))
    ficarOffline(false)
    fetch.mockReturnValue(json(401, { mensagem: 'Faça login para continuar' }))

    const r = await sincronizar()

    expect(r.restantes).toBe(1)
    expect(await pendentes()).toBe(1)
  })

  it('avisa a interface quando a fila muda e permite descartar', async () => {
    const ouvinte = vi.fn()
    const parar = ouvirFila(ouvinte)
    ficarOffline(true)
    const { item } = await enviarOuEnfileirar(...pesagem(1, 300))
    await descartar(item.idCliente)
    parar()

    expect(ouvinte).toHaveBeenCalledTimes(2)
    expect(await listarFila()).toHaveLength(0)
  })
})
