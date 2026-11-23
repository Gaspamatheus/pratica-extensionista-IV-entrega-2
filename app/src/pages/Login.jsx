import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { entrar, logado } = useAuth()
  const navegar = useNavigate()
  const local = useLocation()
  const [form, setForm] = useState({ username: '', senha: '' })
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)

  if (logado) return <Navigate to="/animais" replace />

  async function enviar(e) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      await entrar(form.username.trim(), form.senha)
      navegar(local.state?.de || '/animais', { replace: true })
    } catch (err) {
      setErro(err.status === 401 ? 'Usuário ou senha inválidos.' : err.message)
      setEnviando(false)
    }
  }

  const mudar = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  return (
    <div className="login">
      <div className="login-cartao">
        <div className="login-marca">
          <img src="/icone.svg" alt="" width="56" height="56" />
          <h1>Gado de Corte</h1>
          <p>Controle do rebanho, pesagens e sanidade</p>
        </div>

        <form onSubmit={enviar} noValidate>
          <div className="campo">
            <label htmlFor="username">Usuário</label>
            <input
              id="username"
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              value={form.username}
              onChange={mudar}
              required
            />
          </div>
          <div className="campo">
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              name="senha"
              type="password"
              autoComplete="current-password"
              value={form.senha}
              onChange={mudar}
              required
            />
          </div>

          {erro && (
            <div className="alerta alerta-erro" role="alert">
              {erro}
            </div>
          )}

          <button className="btn btn-primario btn-bloco" disabled={enviando || !form.username || !form.senha}>
            {enviando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
