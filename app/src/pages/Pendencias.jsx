import useFila from '../components/useFila'
import useOnline from '../components/useOnline'
import { Vazio } from '../components/Estado'
import Icone from '../components/Icone'
import { useAviso } from '../context/AvisoContext'
import { dataBR, dataHora } from '../util/formato'

const ROTULO = { pesagem: 'Pesagem', aplicacao: 'Sanidade' }

/** Lançamentos guardados no aparelho que ainda não chegaram na API. */
export default function Pendencias() {
  const { pendentes, falhas, sincronizando, enviarAgora, descartar, tentarDeNovo } = useFila()
  const online = useOnline()
  const mostrarAviso = useAviso()

  async function enviar() {
    const r = await enviarAgora()
    if (r.enviados) mostrarAviso(r.enviados === 1 ? '1 lançamento enviado.' : `${r.enviados} lançamentos enviados.`)
    else if (r.restantes) mostrarAviso('Ainda sem conexão com o servidor. O app tenta de novo sozinho.', 'alerta')
  }

  async function confirmarDescarte(item) {
    if (window.confirm(`Descartar "${item.descricao}"? Ele não será enviado.`)) await descartar(item.idCliente)
  }

  return (
    <section>
      <div className="titulo-pagina">
        <h1>Pendências</h1>
        {pendentes.length > 0 && (
          <button className="btn btn-primario" onClick={enviar} disabled={!online || sincronizando}>
            <Icone nome="enviar" tamanho={18} /> {sincronizando ? 'Enviando...' : 'Enviar agora'}
          </button>
        )}
      </div>
      <p className="ajuda-pagina">
        Lançamentos feitos sem internet ficam guardados neste aparelho e são enviados sozinhos quando a conexão
        volta. Não limpe os dados do navegador enquanto houver pendências.
      </p>

      {falhas.length > 0 && (
        <div className="painel painel-falha">
          <h2>Não aceitos pelo servidor</h2>
          <ul className="linha-tempo">
            {falhas.map((item) => (
              <li key={item.idCliente}>
                <div className="cartao-linha">
                  <strong>
                    {ROTULO[item.tipo] || 'Lançamento'}: {item.descricao}
                  </strong>
                </div>
                <small>
                  Lançado em {dataHora(item.criadoEm)} · data informada {dataBR(item.corpo.data || item.corpo.dataAplicacao)}
                </small>
                <p className="erro-item">{item.erro.mensagem}</p>
                <div className="acoes-item">
                  <button className="btn btn-pequeno" onClick={() => tentarDeNovo(item.idCliente)} disabled={!online}>
                    Tentar de novo
                  </button>
                  <button className="btn btn-pequeno btn-perigo" onClick={() => confirmarDescarte(item)}>
                    Descartar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="painel">
        <h2>Aguardando envio</h2>
        {pendentes.length === 0 ? (
          <Vazio>Tudo enviado. Nenhum lançamento pendente.</Vazio>
        ) : (
          <ul className="linha-tempo">
            {pendentes.map((item) => (
              <li key={item.idCliente}>
                <div className="cartao-linha">
                  <strong>
                    {ROTULO[item.tipo] || 'Lançamento'}: {item.descricao}
                  </strong>
                  <button className="btn-icone" onClick={() => confirmarDescarte(item)} aria-label={`Descartar ${item.descricao}`}>
                    <Icone nome="lixo" tamanho={18} />
                  </button>
                </div>
                <small>
                  Lançado em {dataHora(item.criadoEm)}
                  {item.tentativas > 0 && ` · ${item.tentativas} ${item.tentativas === 1 ? 'tentativa' : 'tentativas'}`}
                </small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
