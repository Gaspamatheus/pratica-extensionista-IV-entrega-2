import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useAviso } from '../context/AvisoContext'
import Icone from './Icone'

const UMA_HORA = 60 * 60 * 1000

/**
 * Registra o service worker (gerado pelo vite-plugin-pwa) e avisa quando sai versão nova.
 * A atualização só acontece quando o usuário toca em "Atualizar", para não recarregar a
 * página no meio de um lançamento.
 */
export default function AtualizacaoApp() {
  const mostrarAviso = useAviso()
  const {
    offlineReady: [prontoOffline, setProntoOffline],
    needRefresh: [temVersaoNova],
    updateServiceWorker
  } = useRegisterSW({
    onRegisteredSW(_url, registro) {
      // procura versão nova de hora em hora, além de cada vez que o app abre
      if (registro) setInterval(() => registro.update().catch(() => {}), UMA_HORA)
    }
  })

  useEffect(() => {
    if (prontoOffline) {
      mostrarAviso('App pronto para funcionar sem internet.')
      setProntoOffline(false)
    }
  }, [prontoOffline, setProntoOffline, mostrarAviso])

  if (!temVersaoNova) return null
  return (
    <div className="faixa faixa-info" role="status">
      <Icone nome="atualizar" tamanho={18} />
      <span className="faixa-texto">Há uma versão nova do app.</span>
      <button className="btn btn-pequeno btn-primario" onClick={() => updateServiceWorker(true)}>
        Atualizar
      </button>
    </div>
  )
}
