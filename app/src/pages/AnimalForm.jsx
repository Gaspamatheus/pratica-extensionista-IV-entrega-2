import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { atualizarAnimal, buscarAnimal, criarAnimal } from '../api/animais'
import { Carregando, Erro } from '../components/Estado'
import Campo from '../components/Campo'
import Icone from '../components/Icone'
import { hojeISO } from '../util/formato'

const VAZIO = {
  brinco: '',
  nome: '',
  raca: '',
  sexo: 'MACHO',
  dataNascimento: '',
  dataEntrada: hojeISO(),
  pesoEntrada: '',
  lote: '',
  observacoes: ''
}

/** Cadastro e edição de animal (somente gerente). */
export default function AnimalForm() {
  const { id } = useParams()
  const editando = Boolean(id)
  const navegar = useNavigate()
  const [form, setForm] = useState(VAZIO)
  const [carregando, setCarregando] = useState(editando)
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!editando) return
    buscarAnimal(id)
      .then((a) => {
        const f = {}
        Object.keys(VAZIO).forEach((k) => (f[k] = a[k] ?? ''))
        setForm(f)
      })
      .catch(setErro)
      .finally(() => setCarregando(false))
  }, [id, editando])

  const mudar = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const campos = erro?.campos || {}

  async function salvar(e) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    // campos opcionais vazios vão como null para a API
    const dados = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === '' ? null : v]))
    if (dados.pesoEntrada !== null) dados.pesoEntrada = Number(String(dados.pesoEntrada).replace(',', '.'))
    try {
      const salvo = editando ? await atualizarAnimal(id, dados) : await criarAnimal(dados)
      navegar(`/animais/${salvo.id}`, { replace: true })
    } catch (err) {
      setErro(err)
      setEnviando(false)
    }
  }

  if (carregando) return <Carregando />

  return (
    <section className="pagina-form">
      <Link to={editando ? `/animais/${id}` : '/animais'} className="voltar">
        <Icone nome="voltar" tamanho={18} /> Voltar
      </Link>
      <h1>{editando ? 'Editar animal' : 'Novo animal'}</h1>

      <form onSubmit={salvar} className="form painel" noValidate>
        <div className="form-grade">
          <Campo rotulo="Brinco *" nome="brinco" value={form.brinco} onChange={mudar} erro={campos.brinco} required maxLength={30} />
          <Campo rotulo="Nome" nome="nome" value={form.nome} onChange={mudar} erro={campos.nome} maxLength={60} />
          <Campo rotulo="Raça" nome="raca" value={form.raca} onChange={mudar} erro={campos.raca} maxLength={60} list="racas" />
          <datalist id="racas">
            {['Nelore', 'Angus', 'Brahman', 'Senepol', 'Tabapuã', 'Guzerá', 'Cruzado'].map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
          <Campo rotulo="Sexo *" nome="sexo" erro={campos.sexo}>
            {(p) => (
              <select {...p} value={form.sexo} onChange={mudar}>
                <option value="MACHO">Macho</option>
                <option value="FEMEA">Fêmea</option>
              </select>
            )}
          </Campo>
          <Campo rotulo="Nascimento" nome="dataNascimento" type="date" max={hojeISO()} value={form.dataNascimento} onChange={mudar} erro={campos.dataNascimento} />
          <Campo rotulo="Entrada na fazenda" nome="dataEntrada" type="date" max={hojeISO()} value={form.dataEntrada} onChange={mudar} erro={campos.dataEntrada} />
          <Campo rotulo="Peso de entrada (kg)" nome="pesoEntrada" type="number" inputMode="decimal" step="0.1" min="0" value={form.pesoEntrada} onChange={mudar} erro={campos.pesoEntrada} />
          <Campo rotulo="Lote / pasto" nome="lote" value={form.lote} onChange={mudar} erro={campos.lote} maxLength={60} />
        </div>
        <Campo rotulo="Observações" nome="observacoes" erro={campos.observacoes}>
          {(p) => <textarea {...p} rows={3} maxLength={500} value={form.observacoes} onChange={mudar} />}
        </Campo>

        {erro && Object.keys(campos).length === 0 && <Erro erro={erro} />}

        <div className="form-rodape">
          <button className="btn btn-primario" disabled={enviando || !form.brinco}>
            {enviando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </section>
  )
}
