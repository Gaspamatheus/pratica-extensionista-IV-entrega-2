/** Rótulo + campo + mensagem de erro (vinda da validação da API em erro.campos). */
export default function Campo({ rotulo, nome, erro, dica, children, ...props }) {
  const id = `campo-${nome}`
  return (
    <div className={`campo ${erro ? 'campo-invalido' : ''}`}>
      <label htmlFor={id}>{rotulo}</label>
      {children ? (
        children({ id, name: nome, 'aria-invalid': Boolean(erro) })
      ) : (
        <input id={id} name={nome} aria-invalid={Boolean(erro)} {...props} />
      )}
      {erro ? <small className="campo-erro">{erro}</small> : dica && <small className="campo-dica">{dica}</small>}
    </div>
  )
}
