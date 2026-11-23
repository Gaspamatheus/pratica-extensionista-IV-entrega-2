import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import Login from './Login'

function montar() {
  render(
    <MemoryRouter initialEntries={['/login']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/animais" element={<p>Tela de animais</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

const json = (status, corpo) =>
  Promise.resolve(new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } }))

describe('tela de login', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => vi.unstubAllGlobals())

  it('mostra erro com senha errada', async () => {
    fetch.mockReturnValue(json(401, { mensagem: 'Usuário ou senha inválidos' }))
    montar()
    await userEvent.type(screen.getByLabelText('Usuário'), 'gerente')
    await userEvent.type(screen.getByLabelText('Senha'), 'errada')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Usuário ou senha inválidos.')
  })

  it('entra e vai para a lista de animais', async () => {
    fetch.mockReturnValue(
      json(200, {
        token: 't',
        tipo: 'Bearer',
        expiraEmSegundos: 3600,
        usuario: { id: 1, nome: 'Gerente', username: 'gerente', role: 'GERENTE' }
      })
    )
    montar()
    await userEvent.type(screen.getByLabelText('Usuário'), 'gerente')
    await userEvent.type(screen.getByLabelText('Senha'), 'gerente123')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByText('Tela de animais')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('gado.sessao')).token).toBe('t')
  })
})
