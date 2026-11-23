// Pequenos componentes de estado reaproveitados nas telas.

export function Carregando({ texto = 'Carregando...' }) {
  return (
    <div className="estado" role="status">
      <span className="spinner" aria-hidden="true" /> {texto}
    </div>
  )
}

export function Erro({ erro, tentarDeNovo }) {
  if (!erro) return null
  return (
    <div className="alerta alerta-erro" role="alert">
      <span>{erro.message || String(erro)}</span>
      {tentarDeNovo && (
        <button className="btn btn-pequeno" onClick={tentarDeNovo}>
          Tentar de novo
        </button>
      )}
    </div>
  )
}

export function Vazio({ children }) {
  return <div className="estado vazio">{children}</div>
}
