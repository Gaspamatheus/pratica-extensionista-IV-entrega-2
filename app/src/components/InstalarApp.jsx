import { useEffect, useState } from 'react'
import Icone from './Icone'

const CHAVE_DISPENSADO = 'gado.instalar.dispensado'

function lerDispensado() {
  try {
    return localStorage.getItem(CHAVE_DISPENSADO) === '1'
  } catch {
    return false
  }
}

/**
 * Convite para instalar o app na tela inicial.
 * Android/Chrome e computador: usa o evento beforeinstallprompt e mostra o botão "Instalar".
 * iPhone (Safari não tem esse evento): explica o caminho Compartilhar > Adicionar à Tela de Início.
 */
export default function InstalarApp() {
  const [evento, setEvento] = useState(null)
  const [dicaIphone, setDicaIphone] = useState(false)
  const [dispensado, setDispensado] = useState(lerDispensado)

  useEffect(() => {
    const aoPoderInstalar = (e) => {
      e.preventDefault() // segura o aviso do navegador para mostrar o nosso botão
      setEvento(e)
    }
    const aoInstalar = () => setEvento(null)
    window.addEventListener('beforeinstallprompt', aoPoderInstalar)
    window.addEventListener('appinstalled', aoInstalar)

    const instalado = window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true
    const iphone = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setDicaIphone(iphone && !instalado)

    return () => {
      window.removeEventListener('beforeinstallprompt', aoPoderInstalar)
      window.removeEventListener('appinstalled', aoInstalar)
    }
  }, [])

  function dispensar() {
    setDispensado(true)
    try {
      localStorage.setItem(CHAVE_DISPENSADO, '1')
    } catch {
      // sem storage: só esconde nesta visita
    }
  }

  async function instalar() {
    evento.prompt()
    await evento.userChoice.catch(() => null)
    setEvento(null)
  }

  if (dispensado || (!evento && !dicaIphone)) return null

  return (
    <div className="faixa faixa-instalar">
      <Icone nome="baixar" tamanho={18} />
      {evento ? (
        <>
          <span className="faixa-texto">Instale o app para usar no campo, mesmo sem internet.</span>
          <button className="btn btn-pequeno btn-primario" onClick={instalar}>
            Instalar
          </button>
        </>
      ) : (
        <span className="faixa-texto">
          Para instalar no iPhone: toque em <strong>Compartilhar</strong> e depois em{' '}
          <strong>Adicionar à Tela de Início</strong>.
        </span>
      )}
      <button className="btn-icone btn-icone-pequeno" onClick={dispensar} aria-label="Dispensar">
        <Icone nome="fechar" tamanho={16} />
      </button>
    </div>
  )
}
