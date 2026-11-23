import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { aplicacoesDoAnimal, buscarAnimal, excluirAnimal, pesagensDoAnimal } from '../api/animais'
import { useAuth } from '../context/AuthContext'
import useCarregar from '../components/useCarregar'
import useFila from '../components/useFila'
import { Carregando, Erro, Vazio } from '../components/Estado'
import Icone from '../components/Icone'
import { Situacao } from './Animais'
import { dataBR, gmd, kg, ROTULO_SEXO, ROTULO_TIPO } from '../util/formato'

export default function AnimalDetalhe() {
  const { id } = useParams()
  const { gerente } = useAuth()
  const navegar = useNavigate()
  const [erroAcao, setErroAcao] = useState(null)

  const carga = useCarregar(
    () => Promise.all([buscarAnimal(id), aplicacoesDoAnimal(id), pesagensDoAnimal(id)]),
    [id]
  )
  const [animal, aplicacoes, pesagens] = carga.dados || []

  // lançamentos deste animal que ainda estão na fila offline
  const { pendentes, versao } = useFila()
  const naFila = pendentes.filter((i) => String(i.animalId) === String(id))
  const pesagensNaFila = naFila.filter((i) => i.tipo === 'pesagem')
  const aplicacoesNaFila = naFila.filter((i) => i.tipo === 'aplicacao')

  useEffect(() => {
    if (versao > 0) carga.recarregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versao])

  async function excluir() {
    if (!window.confirm(`Excluir o cadastro do animal ${animal.brinco}? Use só para cadastro feito por engano.`)) return
    try {
      await excluirAnimal(id)
      navegar('/animais', { replace: true })
    } catch (e) {
      setErroAcao(e)
    }
  }

  if (carga.carregando && !animal) return <Carregando />
  if (carga.erro && !animal) return <Erro erro={carga.erro} tentarDeNovo={carga.recarregar} />

  return (
    <section>
      <Link to="/animais" className="voltar">
        <Icone nome="voltar" tamanho={18} /> Animais
      </Link>

      <div className="titulo-pagina">
        <h1>
          <span className="brinco">{animal.brinco}</span> {animal.nome && <small>{animal.nome}</small>}
        </h1>
        <Situacao animal={animal} />
      </div>

      {animal.emCarencia && (
        <div className="alerta alerta-aviso">
          <Icone nome="alerta" tamanho={18} />
          <span>
            Em carência sanitária até <strong>{dataBR(animal.carenciaAte)}</strong>. A venda fica bloqueada até lá.
          </span>
        </div>
      )}
      <Erro erro={erroAcao} />

      <div className="acoes">
        {animal.status === 'ATIVO' && (
          <>
            <Link to={`/pesagens/nova?animal=${animal.id}`} className="btn btn-primario">
              <Icone nome="balanca" tamanho={18} /> Nova pesagem
            </Link>
            <Link to={`/vacinas/nova?animal=${animal.id}`} className="btn btn-primario">
              <Icone nome="seringa" tamanho={18} /> Nova vacina
            </Link>
          </>
        )}
        {gerente && (
          <>
            <Link to={`/animais/${animal.id}/editar`} className="btn">
              <Icone nome="editar" tamanho={18} /> Editar
            </Link>
            <button className="btn btn-perigo" onClick={excluir}>
              <Icone nome="lixo" tamanho={18} /> Excluir
            </button>
          </>
        )}
      </div>

      <div className="grade-detalhe">
        <div className="painel">
          <h2>Dados</h2>
          <dl className="dados">
            <Dado rotulo="Sexo" valor={ROTULO_SEXO[animal.sexo]} />
            <Dado rotulo="Raça" valor={animal.raca} />
            <Dado rotulo="Lote" valor={animal.lote} />
            <Dado rotulo="Nascimento" valor={dataBR(animal.dataNascimento)} />
            <Dado rotulo="Entrada" valor={dataBR(animal.dataEntrada)} />
            <Dado rotulo="Peso de entrada" valor={kg(animal.pesoEntrada)} />
            <Dado rotulo="Peso atual" valor={kg(animal.pesoAtual)} />
            <Dado rotulo="GMD" valor={gmd(animal.gmdKg)} />
          </dl>
          {animal.observacoes && <p className="obs">{animal.observacoes}</p>}
        </div>

        <div className="painel">
          <h2>Histórico sanitário</h2>
          {aplicacoes.length === 0 && aplicacoesNaFila.length === 0 ? (
            <Vazio>Nenhuma vacina ou medicamento registrado.</Vazio>
          ) : (
            <ul className="linha-tempo">
              {aplicacoesNaFila.map((item) => (
                <ItemNaFila key={item.idCliente} titulo={item.corpo.produto} data={item.corpo.dataAplicacao} />
              ))}
              {aplicacoes.map((ap) => (
                <li key={ap.id}>
                  <div className="cartao-linha">
                    <strong>{ap.produto}</strong>
                    <span className="selo selo-tipo">{ROTULO_TIPO[ap.tipo]}</span>
                  </div>
                  <small>
                    {dataBR(ap.dataAplicacao)}
                    {ap.dose && ` · ${ap.dose}`}
                    {ap.carenciaDias > 0 ? ` · carência até ${dataBR(ap.fimCarencia)}` : ' · sem carência'}
                  </small>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="painel">
          <h2>Pesagens</h2>
          {pesagens.length === 0 && pesagensNaFila.length === 0 ? (
            <Vazio>Nenhuma pesagem registrada.</Vazio>
          ) : (
            <ul className="linha-tempo">
              {pesagensNaFila.map((item) => (
                <ItemNaFila key={item.idCliente} titulo={kg(item.corpo.pesoKg)} data={item.corpo.data} />
              ))}
              {pesagens.map((p) => (
                <li key={p.id}>
                  <div className="cartao-linha">
                    <strong>{kg(p.pesoKg)}</strong>
                    <small>{dataBR(p.data)}</small>
                  </div>
                  {p.observacao && <small>{p.observacao}</small>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}

function ItemNaFila({ titulo, data }) {
  return (
    <li className="item-pendente">
      <div className="cartao-linha">
        <strong>{titulo}</strong>
        <span className="selo selo-pendente">aguardando envio</span>
      </div>
      <small>{dataBR(data)}</small>
    </li>
  )
}

function Dado({ rotulo, valor }) {
  return (
    <div>
      <dt>{rotulo}</dt>
      <dd>{valor || '—'}</dd>
    </div>
  )
}
