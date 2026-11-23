import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { excluirPesagem, listarPesagens } from '../api/pesagens'
import { useAuth } from '../context/AuthContext'
import useCarregar from '../components/useCarregar'
import useFila from '../components/useFila'
import { Carregando, Erro, Vazio } from '../components/Estado'
import Icone from '../components/Icone'
import { dataBR, kg } from '../util/formato'

export default function Pesagens() {
  const { gerente } = useAuth()
  const { pendentes, versao } = useFila()
  const [erroAcao, setErroAcao] = useState(null)
  const carga = useCarregar(() => listarPesagens(), [])
  const naFila = pendentes.filter((i) => i.tipo === 'pesagem')

  // quando a fila envia algo, a lista do servidor muda
  useEffect(() => {
    if (versao > 0) carga.recarregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versao])

  async function excluir(p) {
    if (!window.confirm(`Excluir a pesagem de ${kg(p.pesoKg)} do animal ${p.brinco}?`)) return
    setErroAcao(null)
    try {
      await excluirPesagem(p.id)
      carga.recarregar()
    } catch (e) {
      setErroAcao(e)
    }
  }

  return (
    <section>
      <div className="titulo-pagina">
        <h1>Pesagens</h1>
        <Link to="/pesagens/nova" className="btn btn-primario">
          <Icone nome="mais" tamanho={18} /> <span>Registrar</span>
        </Link>
      </div>

      <Erro erro={carga.erro} tentarDeNovo={carga.recarregar} />
      <Erro erro={erroAcao} />

      <div className="painel">
        <h2>Últimas pesagens</h2>
        {carga.carregando && !carga.dados ? (
          <Carregando />
        ) : carga.dados?.length === 0 && naFila.length === 0 ? (
          <Vazio>Nenhuma pesagem registrada.</Vazio>
        ) : (
          <ul className="linha-tempo">
            {naFila.map((item) => (
              <li key={item.idCliente} className="item-pendente">
                <div className="cartao-linha">
                  <strong>{item.descricao}</strong>
                  <span className="selo selo-pendente">aguardando envio</span>
                </div>
                <small>{dataBR(item.corpo.data)}</small>
              </li>
            ))}
            {(carga.dados || []).map((p) => (
              <li key={p.id}>
                <div className="cartao-linha">
                  <span>
                    <Link to={`/animais/${p.animalId}`} className="brinco">
                      {p.brinco}
                    </Link>{' '}
                    <strong>{kg(p.pesoKg)}</strong>
                  </span>
                  <span className="linha-acoes">
                    <small>{dataBR(p.data)}</small>
                    {gerente && (
                      <button className="btn-icone" onClick={() => excluir(p)} aria-label={`Excluir pesagem do ${p.brinco}`}>
                        <Icone nome="lixo" tamanho={18} />
                      </button>
                    )}
                  </span>
                </div>
                {p.observacao && <small>{p.observacao}</small>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
