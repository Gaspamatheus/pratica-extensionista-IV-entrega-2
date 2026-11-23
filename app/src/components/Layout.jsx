import { useEffect } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { iniciarSincronizacaoAutomatica } from '../offline/fila'
import useOnline from './useOnline'
import useFila from './useFila'
import Icone from './Icone'
import InstalarApp from './InstalarApp'
import AtualizacaoApp from './AtualizacaoApp'

const MENU = [
  { para: '/animais', rotulo: 'Animais', icone: 'boi' },
  { para: '/pesagens', rotulo: 'Pesagens', icone: 'balanca' },
  { para: '/vacinas', rotulo: 'Vacinas', icone: 'seringa' }
]

/**
 * Mobile first: no celular o menu fica embaixo (fácil de alcançar com o polegar);
 * a partir de 900px vira uma barra lateral.
 */
export default function Layout() {
  const { usuario, sair } = useAuth()
  const online = useOnline()
  const { pendentes, falhas, sincronizando, enviarAgora } = useFila()
  const perfil = usuario?.role === 'GERENTE' ? 'Gerente' : 'Funcionário'
  const totalFila = pendentes.length + falhas.length

  // reenvia a fila offline sozinho enquanto o usuário estiver logado
  useEffect(() => iniciarSincronizacaoAutomatica(), [])

  return (
    <div className="casca">
      <header className="topo">
        <div className="marca">
          <img src="/icone.svg" alt="" width="30" height="30" />
          <span>Gado de Corte</span>
        </div>
        <div className="topo-usuario">
          <span className="topo-nome">
            {usuario?.nome}
            {perfil !== usuario?.nome && <small>{perfil}</small>}
          </span>
          <button className="btn-icone" onClick={sair} title="Sair" aria-label="Sair">
            <Icone nome="sair" />
          </button>
        </div>
      </header>

      <div className="faixas">
        {!online && (
          <div className="faixa faixa-offline" role="status">
            <Icone nome="nuvem" tamanho={18} />
            <span className="faixa-texto">
              Sem internet. Você vê os últimos dados salvos e pode lançar pesagens e vacinas: elas são enviadas
              quando a conexão voltar.
            </span>
          </div>
        )}
        {pendentes.length > 0 && (
          <div className="faixa faixa-pendente" role="status">
            <Icone nome="relogio" tamanho={18} />
            <span className="faixa-texto">
              {pendentes.length === 1 ? '1 lançamento aguardando envio' : `${pendentes.length} lançamentos aguardando envio`}
            </span>
            {online && (
              <button className="btn btn-pequeno" onClick={enviarAgora} disabled={sincronizando}>
                {sincronizando ? 'Enviando...' : 'Enviar agora'}
              </button>
            )}
            <Link to="/pendencias" className="faixa-link">
              Ver
            </Link>
          </div>
        )}
        {falhas.length > 0 && (
          <div className="faixa faixa-falha" role="alert">
            <Icone nome="alerta" tamanho={18} />
            <span className="faixa-texto">
              {falhas.length === 1 ? '1 lançamento não foi aceito' : `${falhas.length} lançamentos não foram aceitos`}{' '}
              pelo servidor.
            </span>
            <Link to="/pendencias" className="faixa-link">
              Resolver
            </Link>
          </div>
        )}
        <AtualizacaoApp />
        <InstalarApp />
      </div>

      <nav className="menu" aria-label="Menu principal">
        {MENU.map((item) => (
          <NavLink key={item.para} to={item.para} className="menu-item">
            <Icone nome={item.icone} />
            <span>{item.rotulo}</span>
          </NavLink>
        ))}
        {totalFila > 0 && (
          <NavLink to="/pendencias" className="menu-item">
            <span className="menu-icone-contador">
              <Icone nome="enviar" />
              <span className="contador">{totalFila}</span>
            </span>
            <span>Pendências</span>
          </NavLink>
        )}
      </nav>

      <main className="conteudo">
        <Outlet />
      </main>
    </div>
  )
}
