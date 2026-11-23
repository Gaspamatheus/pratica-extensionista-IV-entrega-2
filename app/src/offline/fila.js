// Fila offline dos lançamentos de campo (pesagens e aplicações sanitárias).
//
// 1. enviarOuEnfileirar tenta mandar para a API. Sem internet (ou com a API fora do ar),
//    o lançamento fica guardado no IndexedDB do aparelho.
// 2. sincronizar reenvia a fila, na ordem em que foi lançada, quando a conexão volta
//    (evento "online", app volta para a tela, ou a cada minuto enquanto houver pendências).
// 3. Cada item leva um idCliente (UUID). Se o mesmo item chegar duas vezes, a API devolve o
//    registro já gravado em vez de duplicar, então reenviar é sempre seguro.
// 4. Se a API recusar um item (ex.: animal vendido nesse meio tempo), ele vira "falha" com a
//    mensagem da API e não trava o resto da fila. O usuário corrige ou descarta.
//
// Foi feito no próprio app (e não com Background Sync do service worker) porque o Safari do
// iPhone não suporta Background Sync, e assim a fila funciona igual em todos os aparelhos.
import { api } from '../api/client'
import { abrirBanco, FILA } from './db'

const ouvintes = new Set()
let sincronizacaoEmAndamento = null

export function novoIdCliente() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID()
  // crypto.randomUUID só existe em HTTPS ou localhost
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

/** Falha de rede ou API fora do ar: vale a pena tentar de novo mais tarde. */
export function ehFalhaTemporaria(erro) {
  return Boolean(erro?.semConexao) || [502, 503, 504].includes(erro?.status)
}

function estaOffline() {
  return typeof navigator !== 'undefined' && navigator.onLine === false
}

/**
 * Envia o lançamento ou, sem conexão, guarda na fila.
 * Devolve { enfileirado: false, dados } quando a API gravou, ou { enfileirado: true, item }.
 * Erros de validação e de regra de negócio (400, 409, 422...) continuam sendo lançados,
 * para o formulário mostrar a mensagem na hora.
 */
export async function enviarOuEnfileirar(caminho, corpo, { tipo, descricao, animalId } = {}) {
  const dados = { ...corpo, idCliente: corpo.idCliente || novoIdCliente() }
  if (!estaOffline()) {
    try {
      return { enfileirado: false, dados: await api.post(caminho, dados) }
    } catch (erro) {
      if (!ehFalhaTemporaria(erro)) throw erro
    }
  }
  const item = await guardar({ caminho, corpo: dados, tipo, descricao, animalId: animalId ?? dados.animalId })
  return { enfileirado: true, item }
}

async function guardar({ caminho, corpo, tipo, descricao, animalId }) {
  const item = {
    idCliente: corpo.idCliente,
    caminho,
    corpo,
    tipo: tipo || 'lancamento',
    descricao: descricao || caminho,
    animalId: animalId ?? null,
    criadoEm: Date.now(),
    tentativas: 0,
    erro: null
  }
  const db = await abrirBanco()
  await db.put(FILA, item)
  avisar()
  return item
}

/** Todos os itens da fila, do mais antigo para o mais novo. */
export async function listarFila() {
  const db = await abrirBanco()
  return db.getAllFromIndex(FILA, 'criadoEm')
}

export async function pendentes() {
  return (await listarFila()).filter((i) => !i.erro).length
}

export async function descartar(idCliente) {
  const db = await abrirBanco()
  await db.delete(FILA, idCliente)
  avisar()
}

/** Tira a marca de falha de um item e tenta enviar de novo. */
export async function tentarDeNovo(idCliente) {
  const db = await abrirBanco()
  const item = await db.get(FILA, idCliente)
  if (item) {
    await db.put(FILA, { ...item, erro: null })
    avisar()
  }
  return sincronizar()
}

/**
 * Reenvia os itens pendentes, em ordem. Para no primeiro problema de conexão (o resto fica
 * para a próxima tentativa) e também se a sessão tiver expirado (401), porque os itens
 * voltam a ser enviados depois do novo login.
 * Devolve { enviados, falhas, restantes }.
 */
export function sincronizar() {
  if (!sincronizacaoEmAndamento) {
    sincronizacaoEmAndamento = executarSincronizacao().finally(() => {
      sincronizacaoEmAndamento = null
    })
  }
  return sincronizacaoEmAndamento
}

async function executarSincronizacao() {
  const resultado = { enviados: 0, falhas: 0, restantes: 0 }
  const itens = (await listarFila()).filter((i) => !i.erro)
  if (itens.length === 0 || estaOffline()) {
    resultado.restantes = itens.length
    return resultado
  }

  const db = await abrirBanco()
  for (let i = 0; i < itens.length; i++) {
    const item = itens[i]
    try {
      await api.post(item.caminho, item.corpo)
      await db.delete(FILA, item.idCliente)
      resultado.enviados++
    } catch (erro) {
      if (ehFalhaTemporaria(erro) || erro?.status === 401) {
        await db.put(FILA, { ...item, tentativas: item.tentativas + 1 })
        resultado.restantes = itens.length - i
        break
      }
      await db.put(FILA, {
        ...item,
        tentativas: item.tentativas + 1,
        erro: { status: erro?.status ?? 0, mensagem: erro?.message || 'Erro ao enviar' }
      })
      resultado.falhas++
    }
  }
  avisar(resultado)
  return resultado
}

/** Avisa a interface sempre que a fila muda. Devolve a função para cancelar. */
export function ouvirFila(fn) {
  ouvintes.add(fn)
  return () => ouvintes.delete(fn)
}

function avisar(resultado) {
  ouvintes.forEach((fn) => {
    try {
      fn(resultado)
    } catch {
      // um ouvinte com erro não pode travar a fila
    }
  })
}

/**
 * Liga o reenvio automático: quando a internet volta, quando o app volta para a tela e,
 * enquanto houver pendências, a cada minuto (no campo o sinal vai e volta sem disparar "online").
 * Devolve a função que desliga.
 */
export function iniciarSincronizacaoAutomatica({ intervaloMs = 60000 } = {}) {
  const tentar = () => {
    sincronizar().catch(() => {})
  }
  const aoVoltarParaTela = () => document.visibilityState === 'visible' && tentar()
  window.addEventListener('online', tentar)
  document.addEventListener('visibilitychange', aoVoltarParaTela)
  const timer = setInterval(async () => {
    if ((await pendentes().catch(() => 0)) > 0) tentar()
  }, intervaloMs)
  tentar()
  return () => {
    window.removeEventListener('online', tentar)
    document.removeEventListener('visibilitychange', aoVoltarParaTela)
    clearInterval(timer)
  }
}
