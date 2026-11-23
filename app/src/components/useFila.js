import { useCallback, useEffect, useState } from 'react'
import { descartar, listarFila, ouvirFila, sincronizar, tentarDeNovo } from '../offline/fila'

/**
 * Estado da fila offline para as telas: itens pendentes, falhas e ações.
 * `versao` aumenta sempre que algum item é enviado, para as telas recarregarem os dados.
 */
export default function useFila() {
  const [itens, setItens] = useState([])
  const [versao, setVersao] = useState(0)
  const [sincronizando, setSincronizando] = useState(false)

  useEffect(() => {
    let ativo = true
    const atualizar = (resultado) => {
      listarFila()
        .then((lista) => ativo && setItens(lista))
        .catch(() => {})
      if (resultado?.enviados && ativo) setVersao((v) => v + 1)
    }
    atualizar()
    const parar = ouvirFila(atualizar)
    return () => {
      ativo = false
      parar()
    }
  }, [])

  const enviarAgora = useCallback(async () => {
    setSincronizando(true)
    try {
      return await sincronizar()
    } finally {
      setSincronizando(false)
    }
  }, [])

  return {
    itens,
    pendentes: itens.filter((i) => !i.erro),
    falhas: itens.filter((i) => i.erro),
    versao,
    sincronizando,
    enviarAgora,
    descartar,
    tentarDeNovo
  }
}
