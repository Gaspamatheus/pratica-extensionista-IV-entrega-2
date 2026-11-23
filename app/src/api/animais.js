import { api } from './client'

export const listarAnimais = ({ status, busca } = {}) => api.get('/animais', { status, busca })
export const buscarAnimal = (id) => api.get(`/animais/${id}`)
export const criarAnimal = (dados) => api.post('/animais', dados)
export const atualizarAnimal = (id, dados) => api.put(`/animais/${id}`, dados)
export const excluirAnimal = (id) => api.del(`/animais/${id}`)
export const pesagensDoAnimal = (id) => api.get(`/animais/${id}/pesagens`)
export const aplicacoesDoAnimal = (id) => api.get(`/animais/${id}/aplicacoes`)
export const resumoRebanho = () => api.get('/dashboard/resumo')
