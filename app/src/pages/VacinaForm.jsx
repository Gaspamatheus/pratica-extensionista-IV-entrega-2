import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { listarAnimais } from '../api/animais'
import { registrarAplicacao } from '../api/sanidade'
import { useAviso } from '../context/AvisoContext'
import useCarregar from '../components/useCarregar'
import { Erro } from '../components/Estado'
import Campo from '../components/Campo'
import Icone from '../components/Icone'
import { hojeISO, ROTULO_TIPO } from '../util/formato'

// Sugestões para agilizar o lançamento no campo. A carência sempre pode ser ajustada
// conforme a bula do produto usado.
const PRODUTOS = [
  { produto: 'Aftosa', tipo: 'VACINA', carenciaDias: 0 },
  { produto: 'Brucelose (B19)', tipo: 'VACINA', carenciaDias: 0 },
  { produto: 'Raiva', tipo: 'VACINA', carenciaDias: 0 },
  { produto: 'Clostridioses', tipo: 'VACINA', carenciaDias: 0 },
  { produto: 'Ivermectina 1%', tipo: 'VERMIFUGO', carenciaDias: 35 },
  { produto: 'Ivermectina 3,15%', tipo: 'VERMIFUGO', carenciaDias: 122 },
  { produto: 'Oxitetraciclina', tipo: 'MEDICAMENTO', carenciaDias: 28 }
]

export default function VacinaForm() {
  const [params] = useSearchParams()
  const animalInicial = params.get('animal') || ''
  const navegar = useNavigate()
  const mostrarAviso = useAviso()
  const [form, setForm] = useState({
    animalId: animalInicial,
    tipo: 'VACINA',
    produto: '',
    dose: '',
    dataAplicacao: hojeISO(),
    carenciaDias: '0',
    observacao: ''
  })
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const { dados: animais, erro: erroAnimais } = useCarregar(() => listarAnimais({ status: 'ATIVO' }), [])

  const mudar = (e) => {
    const { name, value } = e.target
    const novo = { ...form, [name]: value }
    // ao escolher um produto conhecido, preenche tipo e carência
    if (name === 'produto') {
      const sugestao = PRODUTOS.find((p) => p.produto.toLowerCase() === value.toLowerCase())
      if (sugestao) {
        novo.tipo = sugestao.tipo
        novo.carenciaDias = String(sugestao.carenciaDias)
      }
    }
    setForm(novo)
  }
  const campos = erro?.campos || {}

  async function salvar(e) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      const animal = animais?.find((a) => String(a.id) === String(form.animalId))
      const r = await registrarAplicacao({
        brinco: animal?.brinco,
        animalId: Number(form.animalId),
        tipo: form.tipo,
        produto: form.produto.trim(),
        dose: form.dose.trim() || null,
        dataAplicacao: form.dataAplicacao,
        carenciaDias: Number(form.carenciaDias),
        observacao: form.observacao.trim() || null
      })
      mostrarAviso(
        r.enfileirado
          ? `Sem internet: ${form.produto.trim()} guardado no aparelho. Vai ser enviado quando a conexão voltar.`
          : `${form.produto.trim()} registrado.`,
        r.enfileirado ? 'alerta' : 'ok'
      )
      navegar(animalInicial ? `/animais/${animalInicial}` : '/vacinas', { replace: true })
    } catch (err) {
      setErro(err)
      setEnviando(false)
    }
  }

  const prontoParaEnviar = form.animalId && form.produto.trim() && form.dataAplicacao && form.carenciaDias !== ''

  return (
    <section className="pagina-form">
      <Link to={animalInicial ? `/animais/${animalInicial}` : '/vacinas'} className="voltar">
        <Icone nome="voltar" tamanho={18} /> Voltar
      </Link>
      <h1>Registrar vacina ou medicamento</h1>

      <form onSubmit={salvar} className="form painel" noValidate>
        <Erro erro={erroAnimais} />
        <div className="form-grade">
          <Campo rotulo="Animal *" nome="animalId" erro={campos.animalId}>
            {(p) => (
              <select {...p} value={form.animalId} onChange={mudar} required>
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
          <Campo rotulo="Produto *" nome="produto" value={form.produto} onChange={mudar} erro={campos.produto} list="produtos" maxLength={100} required autoComplete="off" />
          <datalist id="produtos">
            {PRODUTOS.map((p) => (
              <option key={p.produto} value={p.produto} />
            ))}
          </datalist>
          <Campo rotulo="Tipo *" nome="tipo" erro={campos.tipo}>
            {(p) => (
              <select {...p} value={form.tipo} onChange={mudar}>
                {Object.entries(ROTULO_TIPO).map(([valor, rotulo]) => (
                  <option key={valor} value={valor}>
                    {rotulo}
                  </option>
                ))}
              </select>
            )}
          </Campo>
          <Campo rotulo="Dose" nome="dose" value={form.dose} onChange={mudar} erro={campos.dose} maxLength={40} placeholder="ex.: 2 ml" />
          <Campo rotulo="Data da aplicação *" nome="dataAplicacao" type="date" max={hojeISO()} value={form.dataAplicacao} onChange={mudar} erro={campos.dataAplicacao} required />
          <Campo
            rotulo="Carência (dias) *"
            nome="carenciaDias"
            type="number"
            inputMode="numeric"
            min="0"
            max="365"
            value={form.carenciaDias}
            onChange={mudar}
            erro={campos.carenciaDias}
            dica="Conforme a bula. 0 se não houver."
            required
          />
        </div>
        <Campo rotulo="Observação" nome="observacao" erro={campos.observacao}>
          {(p) => <textarea {...p} rows={2} maxLength={300} value={form.observacao} onChange={mudar} />}
        </Campo>

        {erro && Object.keys(campos).length === 0 && <Erro erro={erro} />}

        <div className="form-rodape">
          <button className="btn btn-primario" disabled={enviando || !prontoParaEnviar}>
            {enviando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </section>
  )
}
