import { useState } from 'react'
import { Link } from 'react-router-dom'
import { carenciasVigentes, excluirAplicacao, listarAplicacoes } from '../api/sanidade'
import { useAuth } from '../context/AuthContext'
import useCarregar from '../components/useCarregar'
import { Carregando, Erro, Vazio } from '../components/Estado'
import Icone from '../components/Icone'
import { dataBR, diasAte, ROTULO_TIPO } from '../util/formato'

const ABAS = [
  { id: 'carencia', rotulo: 'Em carência' },
  { id: 'historico', rotulo: 'Últimas aplicações' }
]

export default function Vacinas() {
  const { gerente } = useAuth()
  const [aba, setAba] = useState('carencia')
  const [erroAcao, setErroAcao] = useState(null)

  const carga = useCarregar(() => Promise.all([carenciasVigentes(), listarAplicacoes()]), [])
  const [carencias, aplicacoes] = carga.dados || []

  async function excluir(ap) {
    if (!window.confirm(`Excluir a aplicação de ${ap.produto} no animal ${ap.brinco}?`)) return
    setErroAcao(null)
    try {
      await excluirAplicacao(ap.id)
      carga.recarregar()
    } catch (e) {
      setErroAcao(e)
    }
  }

  return (
    <section>
      <div className="titulo-pagina">
        <h1>Vacinas e sanidade</h1>
        <Link to="/vacinas/nova" className="btn btn-primario">
          <Icone nome="mais" tamanho={18} /> <span>Registrar</span>
        </Link>
      </div>

      {/* No celular as listas viram abas; no computador ficam lado a lado. */}
      <div className="abas" role="tablist">
        {ABAS.map((a) => (
          <button
            key={a.id}
            role="tab"
            aria-selected={aba === a.id}
            className={`aba ${aba === a.id ? 'aba-ativa' : ''}`}
            onClick={() => setAba(a.id)}
          >
            {a.rotulo}
            {a.id === 'carencia' && carencias?.length > 0 && <span className="contador">{carencias.length}</span>}
          </button>
        ))}
      </div>

      <Erro erro={carga.erro} tentarDeNovo={carga.recarregar} />
      <Erro erro={erroAcao} />

      {carga.carregando && !carga.dados ? (
        <Carregando />
      ) : (
        carga.dados && (
          <div className="grade-vacinas">
            <div className={`painel ${aba === 'carencia' ? '' : 'oculto-mobile'}`}>
              <h2>Em carência</h2>
              <p className="ajuda">Animais que não podem ser vendidos até o fim da carência.</p>
              {carencias.length === 0 ? (
                <Vazio>Nenhum animal em carência hoje.</Vazio>
              ) : (
                <ul className="linha-tempo">
                  {carencias.map((ap) => {
                    const dias = diasAte(ap.fimCarencia)
                    return (
                      <li key={ap.id}>
                        <div className="cartao-linha">
                          <Link to={`/animais/${ap.animalId}`} className="brinco">
                            {ap.brinco}
                          </Link>
                          <span className="selo selo-carencia">
                            {dias === 0 ? 'último dia' : `faltam ${dias} ${dias === 1 ? 'dia' : 'dias'}`}
                          </span>
                        </div>
                        <small>
                          {ap.produto} · aplicado em {dataBR(ap.dataAplicacao)} · liberado após {dataBR(ap.fimCarencia)}
                        </small>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            <div className={`painel ${aba === 'historico' ? '' : 'oculto-mobile'}`}>
              <h2>Últimas aplicações</h2>
              {aplicacoes.length === 0 ? (
                <Vazio>Nenhuma aplicação registrada.</Vazio>
              ) : (
                <ul className="linha-tempo">
                  {aplicacoes.map((ap) => (
                    <li key={ap.id}>
                      <div className="cartao-linha">
                        <span>
                          <Link to={`/animais/${ap.animalId}`} className="brinco">
                            {ap.brinco}
                          </Link>{' '}
                          <strong>{ap.produto}</strong>
                        </span>
                        <span className="linha-acoes">
                          <span className="selo selo-tipo">{ROTULO_TIPO[ap.tipo]}</span>
                          {gerente && (
                            <button className="btn-icone" onClick={() => excluir(ap)} aria-label={`Excluir aplicação ${ap.produto} do ${ap.brinco}`}>
                              <Icone nome="lixo" tamanho={18} />
                            </button>
                          )}
                        </span>
                      </div>
                      <small>
                        {dataBR(ap.dataAplicacao)}
                        {ap.dose && ` · ${ap.dose}`}
                        {ap.carenciaDias > 0 ? ` · ${ap.carenciaDias} dias de carência` : ' · sem carência'}
                      </small>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )
      )}
    </section>
  )
}
