import { api } from './client'
import { enviarOuEnfileirar } from '../offline/fila'
import { kg } from '../util/formato'

export const listarPesagens = () => api.get('/pesagens')
export const excluirPesagem = (id) => api.del(`/pesagens/${id}`)

/** Registra a pesagem; sem internet ela fica na fila do aparelho. */
export const registrarPesagem = ({ brinco, ...dados }) =>
  enviarOuEnfileirar('/pesagens', dados, {
    tipo: 'pesagem',
    descricao: `${kg(dados.pesoKg)}${brinco ? ` · ${brinco}` : ''}`
  })
