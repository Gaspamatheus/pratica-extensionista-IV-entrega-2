// Banco IndexedDB do aparelho. Guarda os lançamentos feitos sem internet até serem enviados.
import { openDB } from 'idb'

const NOME = 'gado-corte-offline'
const VERSAO = 1
export const FILA = 'fila'

let conexao = null

export function abrirBanco() {
  if (!conexao) {
    conexao = openDB(NOME, VERSAO, {
      upgrade(db) {
        // chave = idCliente (UUID gerado no aparelho); o mesmo id vai para a API e evita duplicar
        const fila = db.createObjectStore(FILA, { keyPath: 'idCliente' })
        fila.createIndex('criadoEm', 'criadoEm')
      }
    })
  }
  return conexao
}

/** Só para os testes: fecha e esquece a conexão. */
export async function fecharBanco() {
  if (conexao) (await conexao).close()
  conexao = null
}
