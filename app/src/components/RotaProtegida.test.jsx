import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { salvarSessao } from '../api/client'
import RotaProtegida from './RotaProtegida'

function montar(caminho) {
  render(
    <MemoryRouter initialEntries={[caminho]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<p>Login</p>} />
          <Route element={<RotaProtegida />}>
            <Route path="/animais" element={<p>Animais</p>} />
            <Route element={<RotaProtegida somenteGerente />}>
              <Route path="/animais/novo" element={<p>Cadastro</p>} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('rotas protegidas', () => {
  beforeEach(() => localStorage.clear())

  it('manda para o login quem não está logado', () => {
    montar('/animais')
    expect(screen.getByText('Login')).toBeInTheDocument()
  })

  it('funcionário não abre o cadastro de animal', () => {
    salvarSessao({ token: 't', usuario: { role: 'FUNCIONARIO' } })
    montar('/animais/novo')
    expect(screen.getByText('Animais')).toBeInTheDocument()
  })

  it('gerente abre o cadastro de animal', () => {
    salvarSessao({ token: 't', usuario: { role: 'GERENTE' } })
    montar('/animais/novo')
    expect(screen.getByText('Cadastro')).toBeInTheDocument()
  })
})
