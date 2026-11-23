import { api } from './client'
import { enviarOuEnfileirar } from '../offline/fila'

export const listarAplicacoes = () => api.get('/sanidade/aplicacoes')
export const carenciasVigentes = () => api.get('/sanidade/carencias')
export const excluirAplicacao = (id) => api.del(`/sanidade/aplicacoes/${id}`)

/**
 * Registra vacina, vermífugo ou medicamento. Passa pela fila offline: sem internet fica
 * guardado no aparelho e é enviado quando a conexão voltar.
 * `brinco` é só para a descrição na lista de pendências.
 */
export const registrarAplicacao = ({ brinco, ...dados }) =>
  enviarOuEnfileirar('/sanidade/aplicacoes', dados, {
    tipo: 'aplicacao',
    descricao: `${dados.produto}${brinco ? ` · ${brinco}` : ''}`
  })
