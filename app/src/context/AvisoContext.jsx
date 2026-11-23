import { createContext, useCallback, useContext, useState } from 'react'

const AvisoContext = createContext(() => {})

/**
 * Mensagens rápidas ("Pesagem registrada") que somem sozinhas. Mostra só a mais recente,
 * para não cobrir o formulário quando o usuário lança vários animais seguidos.
 */
export function AvisoProvider({ children }) {
  const [avisos, setAvisos] = useState([])

  const mostrar = useCallback((texto, tipo = 'ok') => {
    const id = Date.now() + Math.random()
    setAvisos([{ id, texto, tipo }])
    setTimeout(() => setAvisos((lista) => lista.filter((a) => a.id !== id)), 5000)
  }, [])

  return (
    <AvisoContext.Provider value={mostrar}>
      {children}
      <div className="avisos" aria-live="polite">
        {avisos.map((a) => (
          <div
            key={a.id}
            className={`aviso aviso-${a.tipo}`}
            role="status"
            onClick={() => setAvisos((lista) => lista.filter((x) => x.id !== a.id))}
          >
            {a.texto}
          </div>
        ))}
      </div>
    </AvisoContext.Provider>
  )
}

export const useAviso = () => useContext(AvisoContext)
