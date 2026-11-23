import { useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { listarAnimais } from '../api/animais'
import { registrarPesagem } from '../api/pesagens'
import { useAviso } from '../context/AvisoContext'
import useCarregar from '../components/useCarregar'
import { Erro } from '../components/Estado'
import Campo from '../components/Campo'
import Icone from '../components/Icone'
import { dataBR, hojeISO, kg } from '../util/formato'

/**
 * Lançamento de pesagem, pensado para o curral: funciona sem internet (vai para a fila) e,
 * aberto pelo menu, fica pronto para o próximo animal depois de salvar.
 */
export default function PesagemForm() {
  const [params] = useSearchParams()
  const animalFixo = params.get('animal') || ''
  const navegar = useNavigate()
  const mostrarAviso = useAviso()
  const campoAnimal = useRef(null)
  const [form, setForm] = useState({ animalId: animalFixo, data: hojeISO(), pesoKg: '', observacao: '' })
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const { dados: animais, erro: erroAnimais } = useCarregar(() => listarAnimais({ status: 'ATIVO' }), [])

  const animal = animais?.find((a) => String(a.id) === String(form.animalId))
  const mudar = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const campos = erro?.campos || {}
  const peso = Number(String(form.pesoKg).replace(',', '.'))

  async function salvar(e) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      const r = await registrarPesagem({
        brinco: animal?.brinco,
        animalId: Number(form.animalId),
        data: form.data,
        pesoKg: peso,
        observacao: form.observacao.trim() || null
      })
      mostrarAviso(
        r.enfileirado
          ? `Sem internet: pesagem do ${animal?.brinco ?? 'animal'} guardada no aparelho. Vai ser enviada quando a conexão voltar.`
          : `Pesagem do ${animal?.brinco ?? 'animal'} registrada.`,
        r.enfileirado ? 'alerta' : 'ok'
      )
      if (animalFixo) {
        navegar(`/animais/${animalFixo}`, { replace: true })
      } else {
        // próximo animal: mantém a data, limpa o resto
        setForm((f) => ({ ...f, animalId: '', pesoKg: '', observacao: '' }))
        setEnviando(false)
        campoAnimal.current?.focus()
      }
    } catch (err) {
      setErro(err)
      setEnviando(false)
    }
  }

  const pronto = form.animalId && form.data && peso > 0

  return (
    <section className="pagina-form">
      <Link to={animalFixo ? `/animais/${animalFixo}` : '/pesagens'} className="voltar">
        <Icone nome="voltar" tamanho={18} /> Voltar
      </Link>
      <h1>Registrar pesagem</h1>

      <form onSubmit={salvar} className="form painel" noValidate>
        <Erro erro={erroAnimais} />
        <div className="form-grade">
          <Campo rotulo="Animal *" nome="animalId" erro={campos.animalId}>
            {(p) => (
              <select {...p} ref={campoAnimal} value={form.animalId} onChange={mudar} required>
                <option value="">{animais ? 'Selecione o brinco' : 'Carregando...'}</option>
                {animais?.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.brinco}
                    {a.nome ? ` · ${a.nome}` : ''}
                    {a.lote ? ` (${a.lote})` : ''}
                  </option>
                ))}
              </select>
            )}
          </Campo>
          <Campo rotulo="Data *" nome="data" type="date" max={hojeISO()} value={form.data} onChange={mudar} erro={campos.data} required />
          <Campo
            rotulo="Peso (kg) *"
            nome="pesoKg"
            type="number"
            inputMode="decimal"
            step="0.1"
            min="1"
            max="2000"
            className="campo-peso"
            value={form.pesoKg}
            onChange={mudar}
            erro={campos.pesoKg}
            dica={animal?.pesoAtual ? `Último peso: ${kg(animal.pesoAtual)} em ${dataBR(animal.dataUltimaPesagem)}` : undefined}
            required
          />
          <Campo rotulo="Observação" nome="observacao" value={form.observacao} onChange={mudar} erro={campos.observacao} maxLength={300} />
        </div>

        {erro && Object.keys(campos).length === 0 && <Erro erro={erro} />}

        <div className="form-rodape">
          {!animalFixo && <small className="campo-dica">Depois de salvar, o formulário fica pronto para o próximo animal.</small>}
          <button className="btn btn-primario" disabled={enviando || !pronto}>
            {enviando ? 'Salvando...' : 'Salvar pesagem'}
          </button>
        </div>
      </form>
    </section>
  )
}
