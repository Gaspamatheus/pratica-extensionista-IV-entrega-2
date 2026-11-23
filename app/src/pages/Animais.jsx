import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { listarAnimais, resumoRebanho } from '../api/animais'
import { useAuth } from '../context/AuthContext'
import useCarregar from '../components/useCarregar'
import { Carregando, Erro, Vazio } from '../components/Estado'
import Icone from '../components/Icone'
import { dataBR, gmd, kg, ROTULO_SEXO, ROTULO_STATUS } from '../util/formato'

const FILTROS = [
  { valor: 'ATIVO', rotulo: 'Ativos' },
  { valor: 'VENDIDO', rotulo: 'Vendidos' },
  { valor: 'MORTO', rotulo: 'Mortos' },
  { valor: '', rotulo: 'Todos' }
]

export default function Animais() {
  const { gerente } = useAuth()
  const [params, setParams] = useSearchParams()
  const status = params.get('status') ?? 'ATIVO'
  const busca = params.get('busca') ?? ''
  const [texto, setTexto] = useState(busca)

  // espera o usuário parar de digitar antes de buscar
  useEffect(() => {
    const t = setTimeout(() => {
      if (texto !== busca) atualizar({ busca: texto })
    }, 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto])

  function atualizar(novo) {
    const p = { status, busca, ...novo }
    const limpo = {}
    if (p.status !== 'ATIVO') limpo.status = p.status
    if (p.busca) limpo.busca = p.busca
    setParams(limpo, { replace: true })
  }

  const { dados: animais, carregando, erro, recarregar } = useCarregar(
    () => listarAnimais({ status: status || undefined, busca: busca || undefined }),
    [status, busca]
  )
  const { dados: resumo } = useCarregar(() => resumoRebanho(), [])

  return (
    <section>
      <div className="titulo-pagina">
        <h1>Animais</h1>
        {gerente && (
          <Link to="/animais/novo" className="btn btn-primario">
            <Icone nome="mais" tamanho={18} /> <span>Novo animal</span>
          </Link>
        )}
      </div>

      {resumo && (
        <div className="indicadores">
          <Indicador rotulo="Ativos" valor={resumo.animaisAtivos} />
          <Indicador rotulo="Em carência" valor={resumo.animaisEmCarencia} destaque={resumo.animaisEmCarencia > 0} />
          <Indicador rotulo="Peso médio" valor={kg(resumo.pesoMedioKg, 0)} />
          <Indicador rotulo="GMD médio" valor={gmd(resumo.gmdMedioKg)} />
        </div>
      )}

      <div className="filtros">
        <label className="busca">
          <Icone nome="busca" tamanho={18} />
          <input
            type="search"
            placeholder="Buscar por brinco, nome ou lote"
            aria-label="Buscar animal"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
        </label>
        <div className="chips" role="group" aria-label="Filtrar por situação">
          {FILTROS.map((f) => (
            <button
              key={f.rotulo}
              className={`chip ${status === f.valor ? 'chip-ativo' : ''}`}
              aria-pressed={status === f.valor}
              onClick={() => atualizar({ status: f.valor })}
            >
              {f.rotulo}
            </button>
          ))}
        </div>
      </div>

      <Erro erro={erro} tentarDeNovo={recarregar} />
      {carregando && !animais ? (
        <Carregando />
      ) : animais?.length === 0 ? (
        <Vazio>Nenhum animal encontrado.</Vazio>
      ) : (
        <ListaAnimais animais={animais || []} />
      )}
    </section>
  )
}

function Indicador({ rotulo, valor, destaque }) {
  return (
    <div className={`indicador ${destaque ? 'indicador-alerta' : ''}`}>
      <span>{rotulo}</span>
      <strong>{valor}</strong>
    </div>
  )
}

/** Cartões no celular, tabela no computador (o CSS escolhe qual mostrar). */
function ListaAnimais({ animais }) {
  return (
    <>
      <ul className="lista-cartoes">
        {animais.map((a) => (
          <li key={a.id}>
            <Link to={`/animais/${a.id}`} className="cartao-animal">
              <div className="cartao-linha">
                <strong className="brinco">{a.brinco}</strong>
                <Situacao animal={a} />
              </div>
              <div className="cartao-nome">
                {a.nome || 'Sem nome'} · {ROTULO_SEXO[a.sexo]} {a.raca && `· ${a.raca}`}
              </div>
              <div className="cartao-dados">
                <span>{kg(a.pesoAtual)}</span>
                <span>{gmd(a.gmdKg)}</span>
                {a.lote && <span>{a.lote}</span>}
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <div className="tabela-envolve">
        <table className="tabela">
          <thead>
            <tr>
              <th>Brinco</th>
              <th>Nome</th>
              <th>Raça / sexo</th>
              <th>Lote</th>
              <th className="num">Peso atual</th>
              <th className="num">GMD</th>
              <th>Última pesagem</th>
              <th>Situação</th>
            </tr>
          </thead>
          <tbody>
            {animais.map((a) => (
              <tr key={a.id}>
                <td>
                  <Link to={`/animais/${a.id}`} className="brinco">
                    {a.brinco}
                  </Link>
                </td>
                <td>{a.nome || '—'}</td>
                <td>
                  {[a.raca, ROTULO_SEXO[a.sexo]].filter(Boolean).join(' / ')}
                </td>
                <td>{a.lote || '—'}</td>
                <td className="num">{kg(a.pesoAtual)}</td>
                <td className="num">{gmd(a.gmdKg)}</td>
                <td>{dataBR(a.dataUltimaPesagem)}</td>
                <td>
                  <Situacao animal={a} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export function Situacao({ animal }) {
  if (animal.status !== 'ATIVO') {
    return <span className={`selo selo-${animal.status.toLowerCase()}`}>{ROTULO_STATUS[animal.status]}</span>
  }
  if (animal.emCarencia) {
    return (
      <span className="selo selo-carencia" title={`Carência até ${dataBR(animal.carenciaAte)}`}>
        Carência até {dataBR(animal.carenciaAte).slice(0, 5)}
      </span>
    )
  }
  return <span className="selo selo-ativo">Liberado</span>
}
