import { useCallback, useEffect, useState } from 'react'

/** Executa uma busca na API e expõe { dados, carregando, erro, recarregar }. */
export default function useCarregar(buscar, deps = []) {
  const [estado, setEstado] = useState({ dados: null, carregando: true, erro: null })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const executar = useCallback(buscar, deps)

  const recarregar = useCallback(() => {
    let ativo = true
    setEstado((e) => ({ ...e, carregando: true, erro: null }))
    executar()
      .then((dados) => ativo && setEstado({ dados, carregando: false, erro: null }))
      .catch((erro) => ativo && setEstado((e) => ({ ...e, carregando: false, erro })))
    return () => {
      ativo = false
    }
  }, [executar])

  useEffect(() => recarregar(), [recarregar])

  return { ...estado, recarregar }
}
